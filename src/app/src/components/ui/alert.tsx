import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ children, variant = 'default', className = '' }) => {
  const bgColor = variant === 'destructive' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200';
  return (
    <div className={`border rounded-md p-4 ${bgColor} ${className}`}>
      {children}
    </div>
  );
};

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ children, className = '' }) => {
  return <div className={`text-sm text-gray-700 ${className}`}>{children}</div>;
};
