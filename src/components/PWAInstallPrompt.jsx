// src/components/PWAInstallPrompt.jsx
import React, { useState, useEffect } from 'react';
import { usePWA } from '../hooks/usePWA';

const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, installing, installApp } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the prompt
    const hasBeenDismissed = localStorage.getItem('pwa-install-dismissed');
    if (!hasBeenDismissed && isInstallable && !isInstalled) {
      // Show prompt after a delay
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || isInstalled || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-gradient-to-br from-black/95 via-gray-900/95 to-black/95 backdrop-blur-xl border border-lime-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-xl">📱</span>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-sm sm:text-base mb-1">
              Install Favored Online
            </h3>
            <p className="text-gray-300 text-xs sm:text-sm mb-4">
              Get quick access to your career dashboard, projects, and community from your home screen.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleInstall}
                disabled={installing}
                className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:from-lime-600 hover:to-green-600 transition-all duration-300 disabled:opacity-50 flex items-center"
              >
                {installing ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    Installing...
                  </>
                ) : (
                  <>
                    <span className="mr-1">⚡</span>
                    Install
                  </>
                )}
              </button>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white px-3 py-2 text-xs sm:text-sm font-medium transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
