import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';
import { ROUTES } from '../utils/constants';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signup, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await signup(email, password, username || undefined);
      navigate(ROUTES.HOME);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign up failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-[360px]">
        <div className="mb-8">
          <Link to={ROUTES.HOME} className="text-sm font-semibold text-[var(--text)] hover:opacity-70 transition-opacity">
            Steganography
          </Link>
          <h1 className="mt-5 text-xl font-semibold text-[var(--text)]">Create account</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Sign up to save your encode/decode history.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                Username
              </label>
              <span className="text-xs text-[var(--text-muted)]">optional</span>
            </div>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="johndoe"
              className="w-full px-3 py-2.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
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
            {password.length > 0 && password.length < 8 && (
              <p className="mt-1 text-xs text-red-500">At least 8 characters required</p>
            )}
          </div>

          <div className="pt-1">
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Create account
            </Button>
          </div>
        </form>

        <p className="mt-5 text-sm text-[var(--text-secondary)]">
          Already have an account?{' '}
          <Link to={ROUTES.SIGNIN} className="text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </p>

        <p className="mt-2 text-sm">
          <Link to={ROUTES.HOME} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
            Continue without account
          </Link>
        </p>
      </div>
    </div>
  );
}
