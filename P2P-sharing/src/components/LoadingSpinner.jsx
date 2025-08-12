import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-white/20 border-t-blue-500`}></div>
      {text && (
        <p className="text-white/70 text-sm font-medium">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
