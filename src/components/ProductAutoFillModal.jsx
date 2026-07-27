import React, { useState } from 'react';
import { Scan, Camera, Loader2, X, Sparkles, Upload, Image as ImageIcon } from 'lucide-react';
import { productsApi } from '../api/productsApi';
import BarcodeScanner from './BarcodeScanner';

/**
 * Auto-fill helper component for external barcode lookup AND AI Photo Vision extraction.
 * Supports manual barcode lookup, camera barcode scanning, and multi-photo AI vision analysis.
 * 
 * @param {Object} props
 * @param {Function} props.onAutoFill Callback with retrieved product data
 * @param {Function} [props.onError] Optional error callback
 */
export default function ProductAutoFillModal({ onAutoFill, onError }) {
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' or 'barcode'
  const [barcode, setBarcode] = useState('');
  const [loadingBarcode, setLoadingBarcode] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // AI Vision states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);

  const performBarcodeLookup = async (codeToLookup) => {
    const trimmed = (codeToLookup || barcode).trim();
    if (!trimmed) return;
    setLoadingBarcode(true);
    try {
      const result = await productsApi.lookupExternal(trimmed);
      if (onAutoFill) {
        onAutoFill({
          barcode: trimmed,
          productName: result.productName,
          brand: result.brand,
          category: result.category,
          imageUrl: result.imageUrl,
          suggestedPrice: result.suggestedPrice,
        });
      }
      setBarcode('');
      setShowCamera(false);
    } catch (err) {
      if (onError) onError('No external product data found for barcode ' + trimmed);
    } finally {
      setLoadingBarcode(false);
    }
  };

  const handleCameraScan = (scannedCode) => {
    setShowCamera(false);
    setBarcode(scannedCode);
    performBarcodeLookup(scannedCode);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setSelectedFiles((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAiVisionAnalyze = async () => {
    if (!selectedFiles.length) return;
    setLoadingAi(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      // Call Python FastAPI AI Service proxied via Vite /ai-api (prevents HTTPS mixed-content & CORS errors on mobile)
      const aiEndpoint = import.meta.env.VITE_AI_SERVICE_URL
        ? `${import.meta.env.VITE_AI_SERVICE_URL}/api/analyze-product`
        : '/ai-api/analyze-product';

      const response = await fetch(aiEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`AI Service Error (${response.status})`);
      }

      const resData = await response.json();
      if (resData.success && resData.data) {
        if (onAutoFill) {
          const imgPath = resData.data.imageUrl || '';
          const finalImgUrl = imgPath.startsWith('/')
            ? (import.meta.env.VITE_AI_SERVICE_URL ? `${import.meta.env.VITE_AI_SERVICE_URL}${imgPath}` : `/ai-api${imgPath}`)
            : imgPath;

          onAutoFill({
            productName: resData.data.productName,
            brand: resData.data.brand,
            category: resData.data.category,
            baseUnitName: resData.data.baseUnitName || 'Piece',
            barcode: resData.data.barcode || '',
            imageUrl: finalImgUrl,
            lowStockThreshold: resData.data.lowStockThreshold || 10,
          });
        }
        setSelectedFiles([]);
        setPreviewUrls([]);
      } else {
        throw new Error('Could not extract product details');
      }
    } catch (err) {
      if (onError) onError('AI Vision Pipeline: ' + err.message);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'ai'
                ? 'bg-black text-white'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Photo Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('barcode')}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'barcode'
                ? 'bg-black text-white'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Barcode Lookup</span>
          </button>
        </div>
      </div>

      {/* AI Photo Vision Tab */}
      {activeTab === 'ai' && (
        <div className="space-y-3">
          <p className="text-[11px] text-neutral-500">
            Upload 1 or more photos of the product (front label, back package, barcode) for AI extraction & studio image generation.
          </p>

          {/* Photo Previews */}
          {previewUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-neutral-300 group">
                  <img src={url} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer bg-white border border-dashed border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-600 font-medium hover:border-black flex items-center justify-center gap-2 transition-colors">
              <Upload className="w-4 h-4 text-neutral-400" />
              <span>{selectedFiles.length ? 'Add More Photos' : 'Choose Product Photos'}</span>
              <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
            </label>

            <button
              type="button"
              onClick={handleAiVisionAnalyze}
              disabled={loadingAi || !selectedFiles.length}
              className="bg-black text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-40 hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shrink-0"
            >
              {loadingAi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Extract Product Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Barcode Lookup Tab */}
      {activeTab === 'barcode' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
              <Scan className="w-3.5 h-3.5" /> Auto-fill Product via Barcode
            </p>
            <button
              type="button"
              onClick={() => setShowCamera(!showCamera)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                showCamera
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-white text-black border-neutral-300 hover:bg-neutral-100'
              }`}
            >
              {showCamera ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>Close Camera</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>Scan with Camera</span>
                </>
              )}
            </button>
          </div>

          {showCamera && (
            <div className="relative rounded-2xl overflow-hidden border border-neutral-300">
              <BarcodeScanner onScan={handleCameraScan} />
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Enter or scan barcode..."
              className="flex-1 bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black font-mono"
            />
            <button
              type="button"
              onClick={() => performBarcodeLookup(barcode)}
              disabled={loadingBarcode || !barcode.trim()}
              className="bg-black text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-40 hover:bg-neutral-800 transition-colors flex items-center gap-1 shrink-0"
            >
              {loadingBarcode ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Looking...</span>
                </>
              ) : (
                'Lookup'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

