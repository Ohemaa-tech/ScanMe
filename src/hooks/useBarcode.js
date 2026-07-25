import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

export function useBarcode(onScan, onError) {
  const videoRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const codeReaderRef = useRef(null);

  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  const startScan = async () => {
    if (!codeReaderRef.current || !videoRef.current) return;

    try {
      setIsScanning(true);
      setHasCameraPermission(true);

      const videoInputDevices = await codeReaderRef.current.listVideoInputDevices();
      if (!videoInputDevices || videoInputDevices.length === 0) {
        setHasCameraPermission(false);
        if (onError) onError('No camera input device found.');
        setIsScanning(false);
        return;
      }

      // Default to rear environment camera if available
      const selectedDevice = videoInputDevices.find((device) =>
        device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('rear')
      ) || videoInputDevices[0];

      codeReaderRef.current.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const decodedCode = result.getText();
            if (onScan) onScan(decodedCode);
          }
          if (err && !(err.name === 'NotFoundException')) {
            // Silence routine scanning frame misses
          }
        }
      );
    } catch (err) {
      console.error('Camera Access Error:', err);
      setHasCameraPermission(false);
      setIsScanning(false);
      if (onError) onError('Camera permission denied or camera unreadable.');
    }
  };

  const stopScan = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
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
