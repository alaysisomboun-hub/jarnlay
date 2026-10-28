import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RefreshCw, Zap, Volume2, CheckCircle2, AlertCircle } from 'lucide-react';

interface BarcodeCameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
  sampleBarcodes?: Array<{ code: string; name: string }>;
}

export const BarcodeCameraScanner: React.FC<BarcodeCameraScannerProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'ກ້ອງສະແກນບາໂຄດ (Barcode Scanner)',
  sampleBarcodes = [],
}) => {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'barcode-camera-viewport';

  // Play a pleasant beep sound using Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.error('Audio beep error:', e);
    }
  };

  const startScanner = async () => {
    setScannerError(null);
    try {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {
          // ignore stop error
        }
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.ITF,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 160 },
        aspectRatio: 1.333,
      };

      await html5QrCode.start(
        { facingMode },
        config,
        (decodedText) => {
          playBeep();
          setLastScanned(decodedText);
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Continuous scanning error - expected while searching for barcode
        }
      );

      setIsScanning(true);

      // Check for torch capability
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities();
        if (capabilities && (capabilities as any).torch) {
          setHasTorch(true);
        }
      } catch (e) {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.error('Failed to start camera scanner:', err);
      setIsScanning(false);
      setScannerError(
        'ບໍ່ສາມາດເປີດກ້ອງໄດ້: ກະລຸນາກວດສອບການອະນຸຍາດໃຊ້ກ້ອງ (Camera Permission) ໃນ Browser ຂອງທ່ານ.'
      );
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (e) {
        console.error('Failed to stop scanner:', e);
      }
    }
    setIsScanning(false);
  };

  const toggleCameraFacing = async () => {
    await stopScanner();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const toggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      const nextState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any],
      });
      setTorchOn(nextState);
    } catch (e) {
      console.error('Torch error:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startScanner();
      }, 250);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col text-white animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{title}</h3>
              <p className="text-[10px] text-slate-400">ສ່ອງກ້ອງໃສ່ບາໂຄດສິນຄ້າເພື່ອສະແກນ</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport Area */}
        <div className="relative bg-black flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
          {/* HTML5 QR Container */}
          <div id={scannerContainerId} className="w-full h-full min-h-[280px]" />

          {/* Animated Scanning Box Overlay */}
          {isScanning && !scannerError && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-64 h-36 border-2 border-emerald-400/80 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                {/* Corner markers */}
                <span className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-emerald-400 rounded-tl-sm"></span>
                <span className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-emerald-400 rounded-tr-sm"></span>
                <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-emerald-400 rounded-bl-sm"></span>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-emerald-400 rounded-br-sm"></span>

                {/* Laser animation line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse absolute top-1/2 -translate-y-1/2 shadow-[0_0_8px_#34d399]" />
              </div>
            </div>
          )}

          {/* Camera Permission / Device Error */}
          {scannerError && (
            <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
              <p className="text-xs font-semibold text-slate-200 mb-2 leading-relaxed">
                {scannerError}
              </p>
              <button
                onClick={startScanner}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer mt-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>ລອງເປີດກ້ອງໃໝ່</span>
              </button>
            </div>
          )}

          {/* Controls Bar inside video bottom */}
          <div className="absolute bottom-3 left-0 right-0 px-4 flex items-center justify-between z-10 pointer-events-auto">
            <button
              onClick={toggleCameraFacing}
              className="p-2 bg-slate-800/80 backdrop-blur-md hover:bg-slate-700 text-white text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-700 shadow-md"
              title="ສະຫຼັບກ້ອງໜ້າ/ຫຼັງ"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">
                {facingMode === 'environment' ? 'ກ້ອງຫຼັງ' : 'ກ້ອງໜ້າ'}
              </span>
            </button>

            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border shadow-md transition-colors ${
                  torchOn
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800/80 text-white border-slate-700'
                }`}
                title="ເປີດ/ປິດ ໄຟແຟລດ"
              >
                <Zap className="w-3.5 h-3.5" />
                <span className="text-[11px]">ໄຟສາຍ</span>
              </button>
            )}

            <div className="text-[10px] text-emerald-400 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>ກ້ອງພ້ອມສະແກນ</span>
            </div>
          </div>
        </div>

        {/* Scan Status & Quick Simulator for desktop */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 space-y-3">
          {lastScanned && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2 truncate">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">
                  ສະແກນພົບ: <strong className="font-mono text-white">{lastScanned}</strong>
                </span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">
                ເພີ່ມແລ້ວ ✓
              </span>
            </div>
          )}

          {/* Quick preset barcodes button simulator for testing when camera is unavailable */}
          {sampleBarcodes.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                ກົດທົດສອບສະແກນ (Simulator):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {sampleBarcodes.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      playBeep();
                      setLastScanned(item.code);
                      onScanSuccess(item.code);
                    }}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{item.name}</span>
                    <span className="font-mono text-[9px] text-slate-400">({item.code})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
            >
              ສຳເລັດ / ປິດກ້ອງ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
