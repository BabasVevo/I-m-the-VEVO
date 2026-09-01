import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Scan, Sparkles } from 'lucide-react';
import { playPosBeep } from '@/services/saleService';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScannerModal({
  isOpen,
  onScan,
  onClose,
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported on this browser or environment.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);

        // Check if BarcodeDetector is supported natively in browser
        const win = window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } };
        if (win.BarcodeDetector) {
          const detector = new win.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'qr_code', 'upc_a', 'upc_e'],
          });

          const interval = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes && barcodes.length > 0) {
                  const code = barcodes[0].rawValue;
                  if (code) {
                    playPosBeep('success');
                    onScan(code);
                    clearInterval(interval);
                    stopCamera();
                    onClose();
                  }
                }
              } catch {
                // Ignore detection frame error
              }
            }
          }, 300);
        }
      }
    } catch (err: unknown) {
      console.warn('Camera stream error:', err);
      setCameraError(
        'Unable to access device camera. You can manually enter or test barcodes below.'
      );
    }
  }, [onScan, onClose, stopCamera]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    playPosBeep('success');
    onScan(manualCode.trim());
    setManualCode('');
    onClose();
  };

  const handleTestBarcodeClick = (sampleCode: string) => {
    playPosBeep('success');
    onScan(sampleCode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all dark:bg-navy-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <Scan className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Scan Product Barcode
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Point camera at EAN-13 or Code 128 barcode
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-navy-900 dark:hover:bg-navy-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewfinder area */}
        <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden bg-navy-950 p-4 text-white">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-48 w-full rounded-2xl object-cover ${!isCameraActive ? 'hidden' : ''}`}
          />

          {/* Overlay scanner frame */}
          <div className="pointer-events-none absolute inset-8 flex items-center justify-center">
            <div className="relative h-32 w-64 rounded-xl border-2 border-brand-400/80 bg-brand-500/5 shadow-lg">
              {/* Red laser scanning line animation */}
              <div className="absolute top-1/2 left-0 h-0.5 w-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
              <div className="absolute -top-1 -left-1 h-3 w-3 border-t-2 border-l-2 border-brand-400" />
              <div className="absolute -top-1 -right-1 h-3 w-3 border-t-2 border-r-2 border-brand-400" />
              <div className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2 border-brand-400" />
              <div className="absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2 border-brand-400" />
            </div>
          </div>

          {cameraError && (
            <div className="relative z-10 mx-auto max-w-xs rounded-2xl bg-navy-900/90 p-4 text-center text-xs backdrop-blur-xs">
              <Camera className="mx-auto mb-2 h-6 w-6 text-gray-400" />
              <p className="font-semibold text-gray-200">{cameraError}</p>
            </div>
          )}
        </div>

        {/* Manual Input Form */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleManualSubmit}>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Manual Barcode / SKU Entry
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. 616400018901 or COF-ARA-001"
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 font-mono text-xs font-bold text-navy-900 outline-hidden transition focus:border-brand-500 focus:bg-white dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              />
              <button
                type="submit"
                className="rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-brand-600 active:scale-95"
              >
                Scan
              </button>
            </div>
          </form>

          {/* Quick Test Barcode Buttons for Desktop Cashier Testing */}
          <div className="border-t border-gray-100 pt-3 dark:border-navy-800">
            <span className="mb-1.5 block text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              Quick Scan Samples (Demo Items):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { code: '616400018901', name: 'Coffee Beans' },
                { code: '616400018902', name: 'Spiced Chai' },
                { code: '616400018903', name: 'Paper Rolls' },
                { code: '616400018905', name: 'Raw Honey' },
              ].map((sample) => (
                <button
                  key={sample.code}
                  type="button"
                  onClick={() => handleTestBarcodeClick(sample.code)}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-[11px] font-medium text-navy-900 hover:border-brand-500 hover:bg-brand-50 dark:border-navy-700 dark:bg-navy-950 dark:text-gray-300 dark:hover:bg-navy-800"
                >
                  <Sparkles className="h-3 w-3 text-brand-500" />
                  <span>{sample.name} ({sample.code.slice(-4)})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 text-right dark:border-navy-800 dark:bg-navy-950">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-navy-700 dark:bg-navy-900 dark:text-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
