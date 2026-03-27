import React, { useCallback, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '../utils/constants';

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  preview?: string | null;
  onClear?: () => void;
  disabled?: boolean;
}

export default function ImageUploader({
  onFileSelect,
  preview,
  onClear,
  disabled = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(
    (file: File) => {
      setError(null);
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setError('Only JPEG, PNG, WebP, or GIF accepted');
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`Max size is ${MAX_FILE_SIZE_MB}MB`);
        return;
      }
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) validate(file);
    },
    [disabled, validate]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validate(file);
      e.target.value = '';
    },
    [validate]
  );

  if (preview) {
    return (
      <div className="relative rounded-[var(--radius)] overflow-hidden border border-[var(--border)] bg-[var(--surface-muted)]">
        <img src={preview} alt="Preview" className="w-full max-h-56 object-contain" />
        {onClear && !disabled && (
          <button
            onClick={onClear}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-white border border-[var(--border)] rounded text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
            aria-label="Remove"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          flex flex-col items-center justify-center gap-2 py-8 px-4
          border border-dashed rounded-[var(--radius)] cursor-pointer
          transition-colors duration-[var(--transition)]
          ${dragging
            ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
            : 'border-[var(--border)] hover:border-[var(--border-focus)] hover:bg-[var(--surface-muted)]'
          }
          ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
        `}
      >
        <Upload className="w-5 h-5 text-[var(--text-muted)]" />
        <div className="text-center">
          <p className="text-sm text-[var(--text-secondary)]">Drop image here or click to browse</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">JPEG, PNG, WebP, GIF · max {MAX_FILE_SIZE_MB}MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="hidden"
          onChange={handleChange}
          disabled={disabled}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
