// src/components/LoadingSpinner.jsx

import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-lg text-gray-700">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
