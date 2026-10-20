import React, { useState } from 'react';
import { Download, Smartphone, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 transition shadow-[0_0_12px_rgba(16,185,129,0.15)] active:scale-95"
      >
        <Download className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-lg bg-neutral-800/80 border border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#10121a] border border-neutral-800 p-6 shadow-2xl text-white">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-md text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-neutral-300">
                <div className="flex items-start gap-3 bg-neutral-900/60 p-3 rounded-lg border border-neutral-800/60">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">1</span>
                  <span>Tap the <strong>Share</strong> icon in the bottom Safari toolbar.</span>
                </div>
                <div className="flex items-start gap-3 bg-neutral-900/60 p-3 rounded-lg border border-neutral-800/60">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">2</span>
                  <span>Scroll down and select <strong>Add to Home Screen</strong>.</span>
                </div>
                <div className="flex items-start gap-3 bg-neutral-900/60 p-3 rounded-lg border border-neutral-800/60">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">3</span>
                  <span>Tap <strong>Add</strong> in the top-right corner to launch fullscreen anytime.</span>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-black hover:bg-emerald-400 transition"
              >
                Understood
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
