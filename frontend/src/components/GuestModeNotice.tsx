import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

export default function GuestModeNotice() {
  return (
    <p className="text-xs text-[var(--text-muted)]">
      Results are not saved.{' '}
      <Link to={ROUTES.SIGNIN} className="text-[var(--accent)] hover:underline">
        Sign in
      </Link>{' '}
      to keep a history of your work.
    </p>
  );
}
