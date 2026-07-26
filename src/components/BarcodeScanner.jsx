import React, { useEffect, useState } from 'react';
import { useBarcode } from '../hooks/useBarcode';
import { CameraOff, RefreshCw, ScanLine, Search, Keyboard, Maximize2, Minimize2 } from 'lucide-react';

export default function BarcodeScanner({ onScan, onError }) {
  const { videoRef, isScanning, hasCameraPermission, startScan, stopScan } = useBarcode(
    onScan,
    onError
  );
  const [manualInput, setManualInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    startScan();
    return () => stopScan();
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={`transition-all duration-300 rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 bg-black relative text-white ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none border-none'
          : 'w-full max-w-full'
      }`}
    >
      {/* Video Viewfinder Container */}
      <div
        className={`relative w-full bg-black flex flex-col justify-between p-4 sm:p-6 overflow-hidden ${
          isFullscreen ? 'h-screen' : 'aspect-[16/9] min-h-[260px] sm:min-h-[340px]'
        }`}
      >
        {/* Live Camera Video Layer */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover z-0"
          playsInline
          muted
        />

        {/* Top Controls Overlay Row */}
        <div className="relative z-20 flex items-center justify-between w-full">
          {/* Top Left Status Badge */}
          <div className="bg-black/80 backdrop-blur-md border border-neutral-700/80 px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-semibold text-white tracking-wide">
              Camera Active - Terminal 01
            </span>
          </div>

          {/* Fullscreen Camera Mode Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="bg-black/80 hover:bg-neutral-800 backdrop-blur-md border border-neutral-700/80 p-2 rounded-full text-white shadow-xl transition-transform hover:scale-105"
            title={isFullscreen ? 'Exit Full Camera Mode' : 'Expand Full Camera Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Center Glowing White Reticle Overlay */}
        {isScanning && hasCameraPermission && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none p-4">
            <div
              className={`border-2 border-white rounded-2xl relative shadow-[0_0_35px_rgba(255,255,255,0.45)] transition-all ${
                isFullscreen ? 'w-80 sm:w-96 h-40 sm:h-48' : 'w-64 sm:w-80 h-32 sm:h-40'
              }`}
            >
              {/* Animated White Scan Line */}
              <div className="animate-scan-line" />
              
              {/* Corner Reticle Accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white rounded-tl-sm" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white rounded-tr-sm" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white rounded-bl-sm" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white rounded-br-sm" />
            </div>

            <p className="mt-4 text-xs font-medium text-white bg-black/80 backdrop-blur-md px-3.5 py-1 rounded-full border border-neutral-700 flex items-center gap-2 shadow-xl">
              <ScanLine className="w-3.5 h-3.5 text-white animate-pulse" />
              Center barcode in scanning box
            </p>
          </div>
        )}

        {/* Camera Permission / Error State */}
        {!hasCameraPermission && (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 text-center z-30">
            <CameraOff className="w-12 h-12 text-neutral-500 mb-3" />
            <h4 className="font-bold text-base text-white">Camera Feed Unavailable</h4>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs">
              Camera access denied or unreadable. Use manual input bar below.
            </p>
            <button
              onClick={startScan}
              className="mt-4 inline-flex items-center gap-2 text-xs font-bold bg-white text-black hover:bg-neutral-200 px-4 py-2 rounded-xl transition-colors shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Camera
            </button>
          </div>
        )}

        {/* Bottom Floating Manual Barcode Input Bar */}
        <div className="relative z-20 w-full max-w-lg mx-auto">
          <form
            onSubmit={handleManualSubmit}
            className="flex items-center bg-black/90 backdrop-blur-md border border-neutral-700/90 rounded-2xl p-1.5 shadow-2xl focus-within:border-white transition-colors"
          >
            <div className="pl-3 pr-1 text-neutral-400 shrink-0">
              <Keyboard className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Manually enter SKU or Barcode..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 min-w-0 bg-transparent px-2 py-1.5 text-xs text-white placeholder-neutral-400 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-white hover:bg-neutral-200 text-black p-2 rounded-xl transition-colors shrink-0 flex items-center justify-center font-bold shadow-md"
              title="Search Barcode"
            >
              <Search className="w-3.5 h-3.5 text-black" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
