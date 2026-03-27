import { useState, useCallback } from 'react';
import { Download, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../utils/api';
import type { EncodeResponse } from '../types';
import { useAuth } from '../hooks/useAuth';
import ImageUploader from './ImageUploader';
import Button from './Button';
import GuestModeNotice from './GuestModeNotice';

export default function EncodePanel() {
  const { isAuthenticated } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EncodeResponse | null>(null);

  const handleFileSelect = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setPreview(URL.createObjectURL(f));
  }, []);

  const handleClear = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setResult(null);
  }, [preview]);

  const handleEncode = async () => {
    if (!file) { toast.error('Upload an image first'); return; }
    if (!message.trim()) { toast.error('Enter a message to hide'); return; }

    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append('image', file);
      form.append('message', message);
      if (password) form.append('password', password);

      // Do not set Content-Type — the browser must add the multipart boundary
      const { data } = await api.post<EncodeResponse>('/encode', form);
      setResult(data);
      toast.success(isAuthenticated ? 'Encoded and saved' : 'Encoded');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    const filename = result.outputFilename || 'stego_encoded.png';

    if (result.outputImage.startsWith('data:')) {
      // Base64 fallback (Cloudinary not configured)
      const a = document.createElement('a');
      a.href = result.outputImage;
      a.download = filename;
      a.click();
    } else {
      // Cloudinary URL — fetch as blob to force download dialog
      try {
        const res = await fetch(result.outputImage);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } catch {
        // Fallback: open in new tab
        window.open(result.outputImage, '_blank');
      }
    }
  };

  const maxChars = file ? Math.floor((file.size / 3) * 0.85) : null;
  const overLimit = maxChars !== null && message.length > maxChars;

  return (
    <div className="grid lg:grid-cols-2 gap-px bg-[var(--border)] h-full min-h-0">
      {/* Input */}
      <div className="bg-[var(--bg)] p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-md space-y-5">

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
              Image
            </label>
            <ImageUploader
              onFileSelect={handleFileSelect}
              preview={preview}
              onClear={handleClear}
              disabled={loading}
            />
            {file && maxChars && (
              <p className="text-xs text-[var(--text-muted)] mt-1.5">
                {file.name} — up to ~{maxChars.toLocaleString()} characters
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                Message
              </label>
              <span className={`text-xs ${overLimit ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
                {message.length}{maxChars ? ` / ~${maxChars.toLocaleString()}` : ''}
              </span>
            </div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type the message to hide..."
              rows={5}
              disabled={loading}
              className="w-full px-3 py-2.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] resize-none transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                Password
              </label>
              <span className="text-xs text-[var(--text-muted)]">optional</span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Encrypt with AES-256..."
                disabled={loading}
                className="w-full px-3 py-2.5 pr-9 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <Button
            onClick={handleEncode}
            loading={loading}
            disabled={!file || !message.trim() || overLimit || loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Encoding…' : 'Encode'}
          </Button>
        </div>
      </div>

      {/* Output */}
      <div className="bg-[var(--bg)] p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-md">
          <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-4">
            Output
          </p>

          {loading && (
            <div className="flex items-center gap-2.5 py-12 text-[var(--text-muted)]">
              <span className="w-4 h-4 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
              <span className="text-sm">Encoding…</span>
            </div>
          )}

          {!loading && !result && (
            <div className="py-12 text-[var(--text-muted)] text-sm">
              Encoded image will appear here.
            </div>
          )}

          {!loading && result && (
            <div className="space-y-4 animate-fade-in">
              <div className="rounded-[var(--radius)] overflow-hidden border border-[var(--border)] bg-[var(--surface-muted)]">
                <img src={result.outputImage} alt="Encoded" className="w-full max-h-64 object-contain" />
              </div>

              <p className="text-xs text-[var(--text-muted)]">
                Visually identical to the original.{password ? ' Protected with AES-256.' : ''}
              </p>

              <Button
                onClick={handleDownload}
                icon={<Download className="w-3.5 h-3.5" />}
                className="w-full"
              >
                Download image
              </Button>

              {!isAuthenticated && <GuestModeNotice />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
