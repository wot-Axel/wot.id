import React from 'react';

interface AlertProps {
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'info' | 'success' | 'warning';
}

export function Alert({ 
  className = '', 
  children, 
  variant = 'default' 
}: AlertProps) {
  const baseStyles = 'relative w-full rounded-lg border p-4';
  
  const variantStyles = {
    default: 'bg-background text-foreground',
    destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
    info: 'border-blue-500/50 text-blue-700 dark:border-blue-500 [&>svg]:text-blue-500',
    success: 'border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-500',
    warning: 'border-yellow-500/50 text-yellow-700 dark:border-yellow-500 [&>svg]:text-yellow-500'
  };
  
  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} role="alert">
      {children}
    </div>
  );
}

interface AlertTitleProps {
  className?: string;
  children: React.ReactNode;
}

export function AlertTitle({ className = '', children }: AlertTitleProps) {
  return (
    <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`}>
      {children}
    </h5>
  );
}

interface AlertDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

export function AlertDescription({ className = '', children }: AlertDescriptionProps) {
  return (
    <div className={`text-sm [&_p]:leading-relaxed ${className}`}>
      {children}
    </div>
  );
}
