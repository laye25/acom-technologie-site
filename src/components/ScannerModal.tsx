import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Loader2 as SpinnerIcon, XCircle as XCircleIcon, ScanLine, X } from 'lucide-react';

// Custom Modal component declared inline to avoid external import issues
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative max-w-sm w-full bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-2xl overflow-hidden transition-all transform scale-100">
                <div className="px-6 py-4 bg-gray-50 dark:bg-slate-850 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <ScanLine className="w-5 h-5 animate-pulse" />
                        <h3 className="font-black uppercase tracking-widest text-xs">{title}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-full hover:bg-rose-500 hover:text-white transition-all cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

interface ScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
    title?: string;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose, onScanSuccess, title = "Scanner un code" }) => {
    const scannerId = "qr-reader";
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [isStarting, setIsStarting] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const startScanner = async () => {
        setIsStarting(true);
        setError(null);
        
        try {
            // Instantiate with precise barcode and QR formats
            const html5QrCode = new Html5Qrcode(scannerId, {
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.QR_CODE
                ],
                verbose: false,
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true
                }
            });
            scannerRef.current = html5QrCode;

            // Ideal configurations for fast environmental cameras scanning
            const config = { 
                fps: 22, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            await html5QrCode.start(
                { facingMode: "environment" }, 
                config, 
                async (decodedText) => {
                    // Mobile vibrating feedback on successful scan
                    if (navigator.vibrate) {
                        try {
                            navigator.vibrate(200);
                        } catch (err) {
                            console.warn("Haptic feedback not supported on this context/device", err);
                        }
                    }
                    
                    try {
                        if (scannerRef.current && scannerRef.current.isScanning) {
                            await scannerRef.current.stop();
                        }
                        onScanSuccess(decodedText);
                    } catch (err) {
                        console.error("Failed to stop scanner smoothly during success callback", err);
                        onScanSuccess(decodedText);
                    }
                },
                () => {} // Handlers for frame failures can be silently ignored to preserve fluid processing
            );
            setIsStarting(false);
        } catch (err: any) {
            console.error("Camera error:", err);
            if (err.name === 'NotAllowedError' || err.toString().includes('Permission denied')) {
                setError("Accès caméra refusé. Veuillez autoriser la caméra dans les paramètres de votre navigateur.");
            } else {
                setError("Impossible de démarrer la caméra. Vérifiez qu'elle n'est pas utilisée par une autre application (sur mobile, ouvrez l'appli dans un nouvel onglet).");
            }
            setIsStarting(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            // A small delay to let the modal animation stabilize and CSS layout complete
            const timer = setTimeout(() => {
                startScanner();
            }, 400);

            return () => {
                clearTimeout(timer);
                if (scannerRef.current && scannerRef.current.isScanning) {
                    scannerRef.current.stop().catch(console.error);
                }
            };
        }
    }, [isOpen]);

    const handleClose = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
            } catch (err) {
                console.error("Error stopping scanner", err);
            }
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title}>
            <div className="p-6 flex flex-col items-center">
                <div className="relative w-full aspect-square max-w-[300px] bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-200 dark:border-gray-700">
                    <div id={scannerId} className="w-full h-full"></div>
                    
                    {/* Camera Initialization Screen */}
                    {isStarting && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-white z-10">
                            <SpinnerIcon className="w-10 h-10 animate-spin text-yellow-500 mb-3" />
                            <p className="text-xs font-bold uppercase tracking-widest text-center px-4">Initialisation de la caméra...</p>
                        </div>
                    )}

                    {/* Scanning overlay laser bar */}
                    {!isStarting && !error && (
                        <div className="absolute inset-0 pointer-events-none z-20">
                            <div className="absolute top-0 left-0 w-full h-full border-[25px] border-black/40"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border-2 border-yellow-500 rounded-lg shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                                <span className="absolute top-0 left-0 w-full h-1 bg-yellow-500 animate-scan shadow-[0_0_10px_rgba(234,179,8,1)]"></span>
                            </div>
                        </div>
                    )}

                    {/* Camera permissions and connection error handler */}
                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/90 text-white p-6 text-center z-30">
                            <XCircleIcon className="w-12 h-12 mb-3 text-white" />
                            <p className="text-sm font-bold leading-tight">{error}</p>
                            <div className="flex gap-2 mt-4">
                                <button onClick={handleClose} className="px-6 py-2 bg-white/20 text-white border border-white/50 rounded-full font-black text-[10px] uppercase">Annuler</button>
                                <button onClick={startScanner} className="px-6 py-2 bg-white text-red-900 rounded-full font-black text-[10px] uppercase">Réessayer</button>
                            </div>
                        </div>
                    )}
                </div>
                
                <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Placez le code-barres dans le cadre pour le scanner automatiquement.
                </p>

                <button 
                    onClick={handleClose}
                    className="mt-8 w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors"
                >
                    Annuler
                </button>
            </div>
        </Modal>
    );
};

export default ScannerModal;
