// src/components/OfflineIndicator.jsx
import React from 'react';
import { usePWA } from '../hooks/usePWA';

const OfflineIndicator = () => {
  const { isOnline } = usePWA();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 text-center">
      <div className="flex items-center justify-center space-x-2">
        <span className="text-lg">📡</span>
        <span className="font-semibold text-sm">
          You're offline - Some features may be limited
        </span>
      </div>
    </div>
  );
};

export default OfflineIndicator;
