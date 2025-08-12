import React from 'react';
import { Spinner } from '@heroui/react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  } as const;

  return (
    <Spinner size={sizeMap[size]} color="primary" className={className} />
  );
}