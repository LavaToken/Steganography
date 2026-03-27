interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-3 h-3 border-[1.5px]',
  md: 'w-4 h-4 border-2',
  lg: 'w-6 h-6 border-2',
};

export default function LoadingSpinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <span
      className={`inline-block rounded-full border-current border-t-transparent animate-spin ${sizes[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
