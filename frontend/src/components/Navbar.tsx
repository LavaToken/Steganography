import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import Button from './Button';

export default function Navbar() {
  return (
    <header className="h-12 flex items-center px-5 border-b border-[var(--border)] shrink-0">
      <div className="flex-1">
        <Link to={ROUTES.HOME} className="text-sm font-semibold text-[var(--text)] tracking-tight hover:opacity-70 transition-opacity">
          Steganography
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => window.location.href = ROUTES.SIGNIN}>
          Sign in
        </Button>
        <Button variant="secondary" size="sm" onClick={() => window.location.href = ROUTES.SIGNUP}>
          Sign up
        </Button>
      </div>
    </header>
  );
}
