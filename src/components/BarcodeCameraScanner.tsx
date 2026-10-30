import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RefreshCw, Zap, CheckCircle2, AlertCircle, Image as ImageIcon, Sparkles } from 'lucide-react';

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
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const scannerContainerId = 'barcode-camera-viewport';

  // Play a pleasant beep sound using Web Audio API + vibration on mobile
  const playBeep = () => {
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
        navigator.vibrate(100);
      }
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        const audioCtx = new AudioCtxClass();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      }
    } catch (e) {
      console.warn('Audio/Haptic feedback error:', e);
    }
  };

  const startScanner = async () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setScannerError(null);

    try {
      // If scanner is running, stop it first
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch (e) {
          // ignore cleanup errors
        }
      }

      // Check available cameras
      let cameras: Array<{ id: string; label: string }> = [];
      try {
        const devs = await Html5Qrcode.getCameras();
        if (devs && devs.length > 0) {
          cameras = devs.map((d) => ({ id: d.id, label: d.label || `Camera ${d.id}` }));
          setAvailableCameras(cameras);
        }
      } catch (err) {
        console.warn('Could not enumerate cameras, falling back to facingMode:', err);
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

      // Mobile optimized responsive scan area
      const config = {
        fps: 20,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          return {
            width: Math.floor(Math.min(viewfinderWidth * 0.88, 320)),
            height: Math.floor(Math.min(viewfinderHeight * 0.58, 200)),
          };
        },
      };

      // Select camera constraint:
      let cameraConfig: any = { facingMode };
      if (selectedCameraId) {
        cameraConfig = { deviceId: { exact: selectedCameraId } };
      } else if (cameras.length > 0 && facingMode === 'environment') {
        // Find back camera if available
        const backCam = cameras.find((c) => {
          const l = c.label.toLowerCase();
          return l.includes('back') || l.includes('rear') || l.includes('environment') || l.includes('ຫຼັງ');
        });
        if (backCam) {
          cameraConfig = backCam.id;
        } else {
          // Typically on Android/iOS, the last listed camera is the rear camera
          cameraConfig = cameras[cameras.length - 1].id;
        }
      }

      await html5QrCode.start(
        cameraConfig,
        config,
        (decodedText) => {
          playBeep();
          setLastScanned(decodedText);
          onScanSuccess(decodedText);
        },
        () => {
          // Frame not matching - ignore continuous noise
        }
      );

      setIsScanning(true);

      // Check torch capabilities
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities();
        if (capabilities && (capabilities as any).torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      } catch (e) {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.error('Failed to start camera scanner:', err);
      setIsScanning(false);
      setScannerError(
        'ບໍ່ສາມາດເປີດກ້ອງວິດີໂອໄດ້: ກະລຸນາກວດສອບສິດການໃຊ້ກ້ອງ (Camera Permissions) ໃນ Browser ໂທລະສັບ, ຫຼື ໃຊ້ປຸ່ມ "ຖ່າຍຮູບສະແກນ" ດ້ານລຸ່ມແທນໄດ້.'
      );
    } finally {
      isTransitioningRef.current = false;
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        // ignore
      }
    }
    setIsScanning(false);
    setTorchOn(false);
  };

  const toggleCameraFacing = async () => {
    await stopScanner();
    setSelectedCameraId('');
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

  // Mobile fallback: Scan from photo / phone camera snapshot
  const handleScanFromPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    setScannerError(null);

    try {
      // Ensure we have an Html5Qrcode instance
      let qrInstance = scannerRef.current;
      if (!qrInstance) {
        qrInstance = new Html5Qrcode(scannerContainerId, {
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
        scannerRef.current = qrInstance;
      }

      // If live scanning, stop briefly to scan file
      if (qrInstance.isScanning) {
        await qrInstance.stop();
        setIsScanning(false);
      }

      const decoded = await qrInstance.scanFile(file, true);
      if (decoded) {
        playBeep();
        setLastScanned(decoded);
        onScanSuccess(decoded);
      }
    } catch (err: any) {
      alert('ບໍ່ສາມາດອ່ານບາໂຄດຈາກຮູບພາບນີ້ໄດ້: ກະລຸນາຖ່າຍຮູບໃຫ້ເຫັນເສັ້ນບາໂຄດຊັດເຈນ ຫຼື ພິມລະຫັດດ້ວຍຕົນເອງ');
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startScanner();
      }, 200);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, facingMode, selectedCameraId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 sm:rounded-2xl rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col text-white max-h-[96vh]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{title}</h3>
              <p className="text-[10px] text-slate-400">ສ່ອງກ້ອງໃສ່ບາໂຄດສິນຄ້າ ຫຼື ຖ່າຍຮູບສະແກນ</p>
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
        <div className="relative bg-black flex flex-col items-center justify-center min-h-[300px] sm:min-h-[340px] overflow-hidden">
          {/* HTML5 QR Container */}
          <div id={scannerContainerId} className="w-full h-full min-h-[300px]" />

          {/* Animated Scanning Box Overlay */}
          {isScanning && !scannerError && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-68 h-40 border-2 border-emerald-400/90 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.35)]">
                {/* Corner markers */}
                <span className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-3 border-l-3 border-emerald-400 rounded-tl-sm"></span>
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-3 border-r-3 border-emerald-400 rounded-tr-sm"></span>
                <span className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-3 border-l-3 border-emerald-400 rounded-bl-sm"></span>
                <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-3 border-r-3 border-emerald-400 rounded-br-sm"></span>

                {/* Laser animation line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse absolute top-1/2 -translate-y-1/2 shadow-[0_0_10px_#34d399]" />
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                  ວາງບາໂຄດໃຫ້ກົງກອບ
                </span>
              </div>
            </div>
          )}

          {/* Camera Permission / Device Error */}
          {scannerError && (
            <div className="absolute inset-0 bg-slate-950/95 p-6 flex flex-col items-center justify-center text-center z-20">
              <AlertCircle className="w-12 h-12 text-amber-400 mb-2.5" />
              <p className="text-xs font-semibold text-slate-200 mb-4 leading-relaxed max-w-xs">
                {scannerError}
              </p>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button
                  onClick={startScanner}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>ລອງເປີດກ້ອງໃໝ່</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>ຖ່າຍຮູບສະແກນແທນ (Take Photo)</span>
                </button>
              </div>
            </div>
          )}

          {/* Controls Bar inside video bottom */}
          <div className="absolute bottom-3 left-0 right-0 px-3 sm:px-4 flex items-center justify-between z-10 pointer-events-auto">
            <button
              onClick={toggleCameraFacing}
              className="p-2 bg-slate-900/85 backdrop-blur-md hover:bg-slate-800 text-white text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-700 shadow-lg active:scale-95 transition-transform"
              title="ສະຫຼັບກ້ອງໜ້າ/ຫຼັງ"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium">
                {facingMode === 'environment' ? 'ກ້ອງຫຼັງ' : 'ກ້ອງໜ້າ'}
              </span>
            </button>

            {/* Photo Snapshot file input fallback */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleScanFromPhoto}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingPhoto}
              className="px-3 py-2 bg-slate-900/85 backdrop-blur-md hover:bg-slate-800 text-white text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-700 shadow-lg active:scale-95 transition-transform"
              title="ຖ່າຍຮູບສະແກນ"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-medium">
                {isProcessingPhoto ? 'ກຳລັງອ່ານ...' : 'ຖ່າຍຮູບສະແກນ'}
              </span>
            </button>

            {hasTorch ? (
              <button
                onClick={toggleTorch}
                className={`p-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border shadow-lg transition-colors active:scale-95 ${
                  torchOn
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : 'bg-slate-900/85 text-white border-slate-700'
                }`}
                title="ເປີດ/ປິດ ໄຟສາຍ"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">ໄຟສາຍ</span>
              </button>
            ) : (
              <div className="text-[10px] text-emerald-400 bg-slate-950/85 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>ກ້ອງພ້ອມ</span>
              </div>
            )}
          </div>
        </div>

        {/* Scan Status & Quick Simulator for desktop */}
        <div className="p-3 sm:p-4 bg-slate-900/95 border-t border-slate-800 space-y-2.5">
          {lastScanned && (
            <div className="p-2.5 bg-emerald-950/70 border border-emerald-500/50 rounded-xl flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2 truncate">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">
                  ສະແກນພົບ: <strong className="font-mono text-white text-sm">{lastScanned}</strong>
                </span>
              </div>
              <span className="text-[10px] bg-emerald-500/30 px-2 py-0.5 rounded text-emerald-200 font-semibold">
                ອ່ານສຳເລັດ ✓
              </span>
            </div>
          )}

          {/* Quick preset barcodes button simulator for testing when camera is unavailable */}
          {sampleBarcodes.length > 0 && (
            <div className="space-y-1 pt-0.5">
              <span className="text-[10px] text-slate-400 font-semibold block flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>ກົດທົດສອບບາໂຄດສິນຄ້າຕົວຢ່າງ (Simulator):</span>
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
                {sampleBarcodes.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      playBeep();
                      setLastScanned(item.code);
                      onScanSuccess(item.code);
                    }}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                  >
                    <span className="truncate max-w-[120px]">{item.name}</span>
                    <span className="font-mono text-[9px] text-emerald-400">({item.code})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-1 flex gap-2">
            <button
              type="button"
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm text-center"
            >
              ປິດກ້ອງສະແກນ / ສຳເລັດ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
