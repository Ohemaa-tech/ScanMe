import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';

export function useBarcode(onScan, onError) {
  const videoRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const codeReaderRef = useRef(null);
  const lastScannedTimeRef = useRef(0);

  // Audio feedback helper (plays subtle success beep and cleanly closes AudioContext)
  const triggerSuccessFeedback = () => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(120);
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.12);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);

      // Cleanly close AudioContext after beep finishes to prevent continuous sound leaks
      setTimeout(() => {
        try {
          if (ctx.state !== 'closed') {
            ctx.close();
          }
        } catch {}
      }, 200);
    } catch {}
  };

  const stopTracks = () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        if (stream && stream.getTracks) {
          stream.getTracks().forEach((track) => track.stop());
        }
        videoRef.current.srcObject = null;
      }
    } catch {}
  };

  useEffect(() => {
    // Configure reader hints specifically for retail 1D & 2D barcodes
    const hints = new Map();
    const formats = [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
      BarcodeFormat.QR_CODE,
    ];
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);

    // 450ms decode interval to prevent CPU throttling on mobile devices
    codeReaderRef.current = new BrowserMultiFormatReader(hints, 450);

    return () => {
      stopTracks();
      if (codeReaderRef.current) {
        try {
          codeReaderRef.current.reset();
        } catch {}
      }
    };
  }, []);

  const startScan = async () => {
    if (!codeReaderRef.current || !videoRef.current) return;

    try {
      setIsScanning(true);
      setHasCameraPermission(true);

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { min: 640, ideal: 1280 },
          height: { min: 480, ideal: 720 },
        },
      };

      await codeReaderRef.current.decodeFromConstraints(
        constraints,
        videoRef.current,
        (result, err) => {
          if (result) {
            const decodedCode = result.getText();
            const now = Date.now();
            // Debounce scan calls by 1.5s to prevent duplicate rapid triggers
            if (now - lastScannedTimeRef.current > 1500) {
              lastScannedTimeRef.current = now;
              triggerSuccessFeedback();
              if (onScan) onScan(decodedCode);
            }
          }
        }
      );
    } catch (err) {
      console.error('Camera Access Error:', err);
      setHasCameraPermission(false);
      if (onError) onError('Camera access failed or permission denied.');
    }
  };

  const stopScan = () => {
    stopTracks();
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch {}
    }
    setIsScanning(false);
  };

  return {
    videoRef,
    isScanning,
    hasCameraPermission,
    startScan,
    stopScan,
  };
}
