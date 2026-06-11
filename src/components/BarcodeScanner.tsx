import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, ScanLine, Camera, ShieldAlert, Keyboard } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const onScanRef = useRef(onScan);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanRef.current(manualCode.trim());
    }
  };

  useEffect(() => {
    if (!isAuthorized) return;

    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;
    let isStarting = false;

    const startScanner = async () => {
      // Delay slightly because of React 18 strict mode double-renders unmounting/remounting
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (!isMounted) return;

      const element = document.getElementById("reader");
      if (!element) return;

      const onScanSuccess = (decodedText: string) => {
        if (!isMounted) return;
        onScanRef.current(decodedText.trim());
      };

      const onScanFailure = () => {
        // Expected background scanner feed frames where no code is recognized
      };

      try {
        html5QrCode = new Html5Qrcode("reader", {
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

        // Dynamic scanner config with maximum processing speed and ultra-generous wide zone
        const config = {
          fps: 22, // Extra fluid frames per second for real-time video stream inspection
          qrbox: (width: number, height: number) => {
            // Generous wide and tall box so user doesn't have to precisely aim at a tiny box
            const boxWidth = Math.floor(width * 0.90);
            const boxHeight = Math.floor(height * 0.70);
            return {
              width: Math.min(boxWidth, 480),
              height: Math.min(boxHeight, 260)
            };
          },
          aspectRatio: 1.777778 // Ideal landscape crop ratio for modern smartphone primary cameras
        };

        isStarting = true;
        
        // Multi-tier video constraints for maximum camera clarity
        try {
          // Attempt 1: Start using High Definition (HD) Back Camera
          await html5QrCode.start(
            { 
              facingMode: "environment",
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 }
            },
            config,
            onScanSuccess,
            onScanFailure
          );
        } catch (hdErr) {
          console.warn("HD Rear Camera start failed/unsupported. Retrying with Standard Definition (SD)...", hdErr);
          if (isMounted && html5QrCode) {
            // Attempt 2: Fallback to basic Environment Camera (most universal)
            await html5QrCode.start(
              { facingMode: "environment" },
              config,
              onScanSuccess,
              onScanFailure
            );
          }
        }
        
        isStarting = false;

        if (!isMounted) {
          await html5QrCode.stop();
          html5QrCode.clear();
        }
      } catch (err: any) {
        console.warn("Primary environmental cameras failed. Querying system camera devices...", err);
        isStarting = false;
        
        if (isMounted && html5QrCode) {
          try {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0 && isMounted) {
              // Intelligently find back/rear camera if possible from labels
              const rearDevice = devices.find(d => {
                const labelObj = d.label.toLowerCase();
                return (
                  labelObj.includes('back') || 
                  labelObj.includes('rear') || 
                  labelObj.includes('arrière') || 
                  labelObj.includes('principal') || 
                  labelObj.includes('camera 0') || 
                  labelObj.includes('environnement')
                );
              }) || devices[0];

              await html5QrCode.start(
                rearDevice.id,
                { 
                  fps: 22, 
                  qrbox: { width: 320, height: 180 },
                  aspectRatio: 1.777778
                },
                onScanSuccess,
                () => {}
              );
            } else {
              setErrorMsg("Aucune caméra détectée sur cet appareil.");
            }
          } catch (errFallback) {
            console.error("Extreme fallback camera start failed", errFallback);
            setErrorMsg("Impossible d'accéder à la caméra. Veuillez autoriser l'accès dans vos réglages de navigateur.");
          }
        } else {
          setErrorMsg("Erreur d'initialisation du lecteur de code-barres.");
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      const cleanUp = async () => {
        // Wait a small moment to let ongoing starts finish to avoid concurrent lock exceptions
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (html5QrCode) {
          try {
            if (html5QrCode.isScanning) {
              await html5QrCode.stop();
            }
            html5QrCode.clear();
          } catch (error) {
            console.error("Error during scanner unmount cleanup", error);
          }
        }
      };
      cleanUp();
    };
  }, [isAuthorized]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.5)] my-8">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2 text-indigo-600">
            <ScanLine className="w-5 h-5 animate-pulse" />
            <h3 className="font-black uppercase tracking-widest text-xs">Lecteur Code-Barres</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-rose-50 text-rose-500 rounded-full hover:bg-rose-500 hover:text-white transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 bg-white flex flex-col items-center justify-center min-h-[300px]">
          {errorMsg ? (
            <div className="flex flex-col items-center text-center p-4 w-full">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-4 animate-bounce">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Accès Caméra Bloqué</p>
              <p className="text-xs text-gray-500 max-w-xs mb-3">
                {errorMsg}
              </p>
              <div className="bg-yellow-50 text-yellow-800 text-xs text-left p-3 rounded-lg mb-4 max-w-xs border border-yellow-200">
                <p className="font-bold mb-1">💡 Solutions :</p>
                <ul className="list-disc pl-4 space-y-1 text-[10px]">
                  <li>Ouvrez l'application dans <strong>un nouvel onglet</strong>. (Certains navigateurs bloquent la caméra dans cet aperçu).</li>
                  <li>Cliquez sur l'icône de caméra dans la barre d'adresse pour autoriser.</li>
                  <li>Assurez-vous qu'aucune autre application n'utilise la caméra.</li>
                </ul>
              </div>

              <div className="flex gap-2 w-full">
                <button 
                  onClick={() => { setErrorMsg(null); setIsAuthorized(false); }}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-[0.98]"
                >
                  Réessayer
                </button>
              </div>
            </div>
          ) : !isAuthorized ? (
            <div className="flex flex-col items-center text-center py-4 w-full">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-inner animate-pulse">
                <Camera className="w-10 h-10" />
              </div>
              <h4 className="text-base font-bold text-gray-800 mb-2">Activation de la Caméra</h4>
              <p className="text-xs text-gray-500 max-w-xs leading-relaxed mb-6">
                Pour utiliser le scan automatique, veuillez autoriser l'accès à votre caméra.
              </p>
              <button
                onClick={() => setIsAuthorized(true)}
                className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-lg shadow-indigo-600/25 mb-4"
              >
                <Camera className="w-5 h-5" />
                Autoriser la Caméra
              </button>
            </div>
          ) : (
            <div className="w-full">
              <div className="w-full relative rounded-2xl overflow-hidden border-2 border-dashed border-gray-200" style={{ minHeight: '320px' }}>
                <div id="reader" className="w-full h-full min-h-[320px]"></div>
                
                {/* Glowing High contrast laser guide overlay */}
                <div className="absolute inset-x-0 h-1 bg-rose-500/80 shadow-[0_0_12px_#f43f5e] animate-bounce top-[42%] pointer-events-none z-10"></div>
                
                {/* Precise tech corner bracket overlays */}
                <div className="absolute top-4 left-4 w-7 h-7 border-t-4 border-l-4 border-indigo-600 rounded-tl-lg pointer-events-none z-10"></div>
                <div className="absolute top-4 right-4 w-7 h-7 border-t-4 border-r-4 border-indigo-600 rounded-tr-lg pointer-events-none z-10"></div>
                <div className="absolute bottom-4 left-4 w-7 h-7 border-b-4 border-l-4 border-indigo-600 rounded-bl-lg pointer-events-none z-10"></div>
                <div className="absolute bottom-4 right-4 w-7 h-7 border-b-4 border-r-4 border-indigo-600 rounded-br-lg pointer-events-none z-10"></div>
              </div>
              
              <p className="text-center text-[10px] text-gray-500 mt-4 font-bold uppercase tracking-widest leading-relaxed">
                Placez le code-barres bien droit dans la zone du laser rose.
              </p>
            </div>
          )}

          {/* Saisie Manuelle de Secours / Lecteur Douchette USB standard */}
          <div className="w-full border-t border-gray-100 pt-6 mt-6">
            <div className="flex items-center gap-2 text-gray-700 mb-3">
              <Keyboard className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Solution alternative</span>
            </div>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Saisir SKU / Code-barres..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-300"
              />
              <button
                type="submit"
                className="py-3 px-5 bg-gray-900 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
              >
                Valider
              </button>
            </form>
            <p className="text-[10px] text-gray-400 mt-2 font-medium">
              * Saisissez le code ou utilisez un lecteur douchette USB connecté à votre appareil.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
