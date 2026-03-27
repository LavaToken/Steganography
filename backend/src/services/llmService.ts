import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    if (!env.ANTHROPIC_API_KEY) {
      throw Object.assign(new Error('Anthropic API key not configured'), { statusCode: 503 });
    }
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function analyzeImageContext(
  base64Image: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
  hasHiddenMessage: boolean
): Promise<string> {
  const anthropic = getClient();

  const prompt = hasHiddenMessage
    ? `You are a steganography expert. The user just decoded a hidden message from this image. 
       Briefly describe: 1) What the image shows visually, 2) Any interesting observations about 
       why this image might have been chosen for steganography. Keep it concise (2-3 sentences).`
    : `You are a steganography expert helping a user choose an image for hiding a secret message. 
       Briefly describe: 1) What this image shows, 2) Whether it's a good candidate for steganography 
       (complex textures hide changes better than flat areas). Keep it concise (2-3 sentences).`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Image },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });

  const content = message.content[0];
  if (content.type === 'text') return content.text;
  return 'Image analysis unavailable.';
}
