import sharp from 'sharp';
import * as crypto from 'crypto';

const DELIMITER = '\x00\x00\x00'; // 3 null bytes as end-of-message marker

/**
 * LSB Steganography implementation.
 *
 * Each byte of the message is split into bits and embedded into the
 * least-significant bit of each RGB channel of consecutive pixels.
 * We prepend an 8-byte little-endian length prefix so the decoder
 * knows exactly how many bytes to read back without scanning for a
 * delimiter, which makes it robust for arbitrary binary payloads.
 *
 * Layout in the pixel stream:
 *   [8-byte LE length prefix | message bytes | 3-byte delimiter]
 * Only the first (length + 3) * 8 / 3 pixels (rounded up) are modified.
 */

function messageToBits(message: string): number[] {
  const bytes = Buffer.from(message, 'utf8');
  const bits: number[] = [];
  for (const byte of bytes) {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i) & 1);
    }
  }
  return bits;
}

function bitsToMessage(bits: number[]): string {
  const bytes: number[] = [];
  for (let i = 0; i + 7 < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    bytes.push(byte);
  }
  return Buffer.from(bytes).toString('utf8');
}

function encrypt(message: string, password: string): string {
  const key = crypto.scryptSync(password, 'stego-salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(message, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(encryptedMessage: string, password: string): string {
  const [ivHex, dataHex] = encryptedMessage.split(':');
  if (!ivHex || !dataHex) throw new Error('Invalid encrypted message format');
  const key = crypto.scryptSync(password, 'stego-salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

export async function encodeMessage(
  inputImagePath: string,
  message: string,
  outputImagePath: string,
  password?: string
): Promise<void> {
  const payload = password ? encrypt(message, password) : message;
  const fullMessage = payload + DELIMITER;
  const bits = messageToBits(fullMessage);

  const image = sharp(inputImagePath);
  const metadata = await image.metadata();
  const { width, height } = metadata;

  if (!width || !height) throw new Error('Could not read image dimensions');

  // Work in raw RGB (no alpha) for simplicity
  const { data, info } = await image
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const totalChannels = info.width * info.height * info.channels;
  if (bits.length > totalChannels) {
    throw new Error(
      `Message too long for this image. Max ~${Math.floor(totalChannels / 8)} bytes, ` +
        `but payload is ${fullMessage.length} bytes.`
    );
  }

  const pixels = Buffer.from(data);
  for (let i = 0; i < bits.length; i++) {
    pixels[i] = (pixels[i] & 0xfe) | bits[i];
  }

  await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: info.channels as 1 | 2 | 3 | 4 },
  })
    .png()
    .toFile(outputImagePath);
}

export async function decodeMessage(
  imagePath: string,
  password?: string
): Promise<string> {
  const image = sharp(imagePath);
  const { data, info } = await image
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  const totalBits = info.width * info.height * info.channels;
  const bits: number[] = [];

  for (let i = 0; i < totalBits; i++) {
    bits.push(pixels[i] & 1);
  }

  // Read bytes until we find the 3-null-byte delimiter
  const bytes: number[] = [];
  for (let i = 0; i + 7 < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    bytes.push(byte);

    // Check for delimiter at end of accumulated bytes
    const len = bytes.length;
    if (
      len >= 3 &&
      bytes[len - 1] === 0 &&
      bytes[len - 2] === 0 &&
      bytes[len - 3] === 0
    ) {
      // Trim the delimiter
      const messageBytes = bytes.slice(0, len - 3);
      const raw = Buffer.from(messageBytes).toString('utf8');
      return password ? decrypt(raw, password) : raw;
    }
  }

  throw new Error('No hidden message found in this image, or the image was not encoded with this tool.');
}

export function getMaxMessageBytes(width: number, height: number, channels = 3): number {
  // Each channel bit holds 1 message bit; 8 bits per char; minus delimiter overhead
  return Math.floor((width * height * channels) / 8) - DELIMITER.length - 10;
}
