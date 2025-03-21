
import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'success' | 'destructive' | 'warning' | 'info';
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  className,
  size = 'md',
  variant = 'primary',
  ...props 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
  };
  
  const variantClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    success: 'text-green-500',
    destructive: 'text-destructive',
    warning: 'text-amber-500',
    info: 'text-blue-500',
  };

  return (
    <div
      className={cn(
        'inline-block animate-spin rounded-full border-solid border-current border-t-transparent',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
