import { useState, useCallback } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../utils/api';
import type { DecodeResponse } from '../types';
import { useAuth } from '../hooks/useAuth';
import ImageUploader from './ImageUploader';
import Button from './Button';
import GuestModeNotice from './GuestModeNotice';

export default function DecodePanel() {
  const { isAuthenticated } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DecodeResponse | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleDecode = async () => {
    if (!file) { toast.error('Upload an image first'); return; }
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append('image', file);
      if (password) form.append('password', password);

      const { data } = await api.post<DecodeResponse>('/decode', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      toast.success('Message extracted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.message) return;
    await navigator.clipboard.writeText(result.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                Password
              </label>
              <span className="text-xs text-[var(--text-muted)]">if protected</span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Leave blank if not encrypted"
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
            onClick={handleDecode}
            loading={loading}
            disabled={!file || loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Decoding…' : 'Decode'}
          </Button>
        </div>
      </div>

      {/* Output */}
      <div className="bg-[var(--bg)] p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-md">
          <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-4">
            Extracted message
          </p>

          {loading && (
            <div className="flex items-center gap-2.5 py-12 text-[var(--text-muted)]">
              <span className="w-4 h-4 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
              <span className="text-sm">Extracting…</span>
            </div>
          )}

          {!loading && !result && (
            <div className="py-12 text-[var(--text-muted)] text-sm">
              Decoded message will appear here.
            </div>
          )}

          {!loading && result && (
            <div className="space-y-3 animate-fade-in">
              <div className="relative">
                <pre className="w-full min-h-28 p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] text-sm font-mono text-[var(--text)] whitespace-pre-wrap break-words leading-relaxed">
                  {result.message}
                </pre>
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] bg-[var(--surface)] rounded transition-colors"
                  title="Copy"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>{result.message.length} characters</span>
                <button
                  onClick={handleCopy}
                  className="text-[var(--accent)] hover:underline"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              {!isAuthenticated && <GuestModeNotice />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
