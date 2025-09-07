// src/components/PWAUpdateBanner.jsx
import React, { useState } from 'react';
import { usePWA } from '../hooks/usePWA';

const PWAUpdateBanner = () => {
  const { updateAvailable, updateApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || dismissed) {
    return null;
  }

  const handleUpdate = () => {
    updateApp();
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xl">🔄</span>
          <div>
            <p className="font-semibold text-sm sm:text-base">
              New version available!
            </p>
            <p className="text-xs sm:text-sm opacity-90">
              Update to get the latest features and improvements.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleUpdate}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
          >
            Update Now
          </button>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white px-2 py-2 text-sm"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAUpdateBanner;
