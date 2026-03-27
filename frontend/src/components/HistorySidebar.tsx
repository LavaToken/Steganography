import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Unlock, Trash2, ChevronLeft, ChevronRight, LogOut, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../utils/api';
import type { Prompt, PromptsResponse } from '../types';
import { useAuth } from '../hooks/useAuth';
import { formatDate, truncateText } from '../utils/formatters';
import { ROUTES } from '../utils/constants';
import LoadingSpinner from './LoadingSpinner';

interface HistorySidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function HistorySidebar({ collapsed, onToggle }: HistorySidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRecent = useCallback(async () => {
    try {
      const { data } = await api.get<PromptsResponse>('/prompts', { params: { limit: 20, page: 1 } });
      setPrompts(data.prompts);
    } catch {
      // silently fail — sidebar is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecent(); }, [fetchRecent]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await api.delete(`/prompts/${id}`);
      setPrompts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };

  const initials = (user?.username || user?.email || '?').slice(0, 2).toUpperCase();

  return (
    <aside
      className={`relative flex flex-col h-full bg-[var(--surface)] border-r border-[var(--border)] shrink-0 transition-all duration-200 ${collapsed ? 'w-12' : 'w-52'}`}
    >
      {/* Header */}
      <div className={`h-12 flex items-center border-b border-[var(--border)] shrink-0 ${collapsed ? 'justify-center px-0' : 'px-4 justify-between'}`}>
        {!collapsed && (
          <span className="text-sm font-semibold text-[var(--text)] tracking-tight">
            Steganography
          </span>
        )}
        <button
          onClick={onToggle}
          className="w-6 h-6 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors rounded"
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto py-2">
        {!collapsed && (
          <>
            <div className="px-4 py-2 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wide">Recent</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-6">
                <LoadingSpinner size="sm" className="text-[var(--text-muted)]" />
              </div>
            ) : prompts.length === 0 ? (
              <p className="px-4 py-3 text-xs text-[var(--text-muted)]">No history yet.</p>
            ) : (
              <ul className="space-y-0.5 px-2">
                {prompts.map(prompt => (
                  <li
                    key={prompt.id}
                    className="group flex items-start gap-2 px-2 py-2 rounded-[var(--radius)] hover:bg-[var(--surface-muted)] transition-colors cursor-default"
                  >
                    <span className={`mt-0.5 shrink-0 w-4 h-4 flex items-center justify-center rounded text-[10px] font-semibold ${prompt.type === 'encode' ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'bg-emerald-50 text-emerald-700'}`}>
                      {prompt.type === 'encode' ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--text)] leading-tight truncate">
                        {prompt.message ? truncateText(prompt.message, 40) : 'Image only'}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{formatDate(prompt.createdAt)}</p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, prompt.id)}
                      disabled={deletingId === prompt.id}
                      className="shrink-0 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-all"
                    >
                      {deletingId === prompt.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {prompts.length > 0 && (
              <div className="px-4 mt-2">
                <Link
                  to={ROUTES.HISTORY}
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  View all history
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* User footer */}
      <div className={`border-t border-[var(--border)] py-3 ${collapsed ? 'flex flex-col items-center gap-2 px-0' : 'px-3 space-y-1'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 px-1 py-1.5">
            <div className="w-6 h-6 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center shrink-0">
              <span className="text-[10px] font-semibold text-[var(--accent)]">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--text)] truncate">
                {user?.username || user?.email?.split('@')[0]}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title="Sign out"
          className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-[var(--radius)] text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-red-600 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
