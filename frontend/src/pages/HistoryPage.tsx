import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Lock, Unlock, Image as ImageIcon, Search, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../utils/api';
import type { Prompt, PromptsResponse } from '../types';
import { formatDate, truncateText } from '../utils/formatters';
import { ROUTES } from '../utils/constants';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchPrompts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get<PromptsResponse>('/prompts', { params: { page, limit: 15 } });
      setPrompts(data.prompts);
      setPagination({ page: data.pagination.page, pages: data.pagination.pages, total: data.pagination.total });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrompts(); }, [fetchPrompts]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/prompts/${id}`);
      setPrompts(prev => prev.filter(p => p.id !== id));
      if (expanded === id) setExpanded(null);
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = prompts.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.type.includes(q) || (p.message?.toLowerCase().includes(q) ?? false);
  });

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-[var(--text)]">History</h1>
            <p className="text-xs text-[var(--text-muted)]">{pagination.total} operations</p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-8 pr-3 py-1.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] transition-colors w-40"
            />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" className="text-[var(--text-muted)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <ImageIcon className="w-8 h-8 text-[var(--border)]" />
            <p className="text-sm text-[var(--text-muted)]">
              {search ? 'No results' : 'No history yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map(prompt => (
              <div key={prompt.id} className="border border-[var(--border)] rounded-[var(--radius)] overflow-hidden bg-[var(--surface)]">
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--surface-muted)] transition-colors"
                  onClick={() => setExpanded(expanded === prompt.id ? null : prompt.id)}
                >
                  <span className={`shrink-0 w-5 h-5 flex items-center justify-center rounded text-[10px] ${prompt.type === 'encode' ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'bg-emerald-50 text-emerald-700'}`}>
                    {prompt.type === 'encode' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text)] truncate">
                      {prompt.message ? truncateText(prompt.message, 70) : 'Image only'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {prompt.hasPassword && (
                      <Lock className="w-3 h-3 text-[var(--text-muted)]" />
                    )}
                    <span className="text-xs text-[var(--text-muted)]">{formatDate(prompt.createdAt)}</span>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(prompt.id); }}
                      disabled={deletingId === prompt.id}
                      className="w-6 h-6 flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-colors"
                    >
                      {deletingId === prompt.id
                        ? <LoadingSpinner size="sm" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                </div>

                {expanded === prompt.id && prompt.message && (
                  <div className="px-4 pb-4 pt-1 border-t border-[var(--border)] bg-[var(--bg)]">
                    <pre className="text-xs font-mono text-[var(--text)] whitespace-pre-wrap break-words leading-relaxed">
                      {prompt.message}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchPrompts(pagination.page - 1)}
              disabled={pagination.page <= 1}
              icon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Previous
            </Button>
            <span className="text-xs text-[var(--text-secondary)]">
              {pagination.page} / {pagination.pages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchPrompts(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              icon={<ChevronRight className="w-3.5 h-3.5" />}
              iconPosition="right"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
