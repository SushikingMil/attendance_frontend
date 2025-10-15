import { useState, useEffect, useRef } from 'react';
import { qrCodeAPI } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Html5Qrcode } from 'html5-qrcode';

const QRScannerPage = () => {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastScan, setLastScan] = useState(null);
  const [selectedAction, setSelectedAction] = useState('punch_in');
  const [manualToken, setManualToken] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      setError('');
      setSuccess('');
      setScanning(true);

      // Crea l'istanza dello scanner
      html5QrCodeRef.current = new Html5Qrcode('qr-reader');

      // Avvia la scansione
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' }, // Usa la fotocamera posteriore
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        onScanFailure
      );
    } catch (err) {
      setError('Errore nell\'avvio della fotocamera: ' + err.message);
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current && scanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      }
      setScanning(false);
    } catch (err) {
      console.error('Errore nella chiusura dello scanner:', err);
    }
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
    // Ferma lo scanner dopo una scansione riuscita
    await stopScanner();
    
    // Processa il QR code scansionato
    await processQRCode(decodedText);
  };

  const onScanFailure = (error) => {
    // Ignora gli errori di scansione normali (quando non trova un QR code)
    // console.log('Scan error:', error);
  };

  const processQRCode = async (token) => {
    try {
      setError('');
      setSuccess('');

      const response = await qrCodeAPI.scanQRCode(token, user.id, selectedAction);
      
      setSuccess(response.message);
      setLastScan({
        action: selectedAction,
        timestamp: response.timestamp,
        user: response.user
      });

      // Reset dopo 3 secondi
      setTimeout(() => {
        setSuccess('');
      }, 3000);

    } catch (err) {
      setError('Errore nella scansione: ' + err.message);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualToken.trim()) {
      setError('Inserisci un token valido');
      return;
    }
    await processQRCode(manualToken.trim());
    setManualToken('');
  };

  const getActionLabel = (action) => {
    const labels = {
      punch_in: 'Entrata',
      punch_out: 'Uscita',
      break_in: 'Inizio Pausa',
      break_out: 'Fine Pausa'
    };
    return labels[action] || action;
  };

  const getActionColor = (action) => {
    const colors = {
      punch_in: 'bg-green-600 hover:bg-green-700',
      punch_out: 'bg-red-600 hover:bg-red-700',
      break_in: 'bg-yellow-600 hover:bg-yellow-700',
      break_out: 'bg-blue-600 hover:bg-blue-700'
    };
    return colors[action] || 'bg-gray-600 hover:bg-gray-700';
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Scansione QR Code</h1>
        <p className="text-gray-600">Scansiona il QR code per registrare la tua presenza</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        </div>
      )}

      {/* Selezione Azione */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Seleziona Azione</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedAction('punch_in')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedAction === 'punch_in'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🟢</div>
              <div className="font-semibold">Entrata</div>
            </div>
          </button>
          <button
            onClick={() => setSelectedAction('punch_out')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedAction === 'punch_out'
                ? 'border-red-600 bg-red-50'
                : 'border-gray-200 hover:border-red-300'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🔴</div>
              <div className="font-semibold">Uscita</div>
            </div>
          </button>
          <button
            onClick={() => setSelectedAction('break_in')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedAction === 'break_in'
                ? 'border-yellow-600 bg-yellow-50'
                : 'border-gray-200 hover:border-yellow-300'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">⏸️</div>
              <div className="font-semibold">Inizio Pausa</div>
            </div>
          </button>
          <button
            onClick={() => setSelectedAction('break_out')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedAction === 'break_out'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">▶️</div>
              <div className="font-semibold">Fine Pausa</div>
            </div>
          </button>
        </div>
      </div>

      {/* Scanner QR Code */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Scanner</h2>
        
        {!scanning ? (
          <div className="text-center">
            <div className="mb-4">
              <svg className="w-24 h-24 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">
              Premi il pulsante per avviare la fotocamera e scansionare il QR code
            </p>
            <button
              onClick={startScanner}
              className={`${getActionColor(selectedAction)} text-white px-6 py-3 rounded-lg transition-colors font-semibold`}
            >
              Avvia Scansione - {getActionLabel(selectedAction)}
            </button>
          </div>
        ) : (
          <div>
            <div id="qr-reader" ref={scannerRef} className="mb-4 rounded-lg overflow-hidden"></div>
            <button
              onClick={stopScanner}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Ferma Scansione
            </button>
          </div>
        )}
      </div>

      {/* Input Manuale */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="w-full text-left flex items-center justify-between"
        >
          <h2 className="text-lg font-semibold">Inserimento Manuale Token</h2>
          <svg
            className={`w-5 h-5 transition-transform ${showManualInput ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showManualInput && (
          <form onSubmit={handleManualSubmit} className="mt-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token QR Code
              </label>
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Inserisci il token del QR code"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className={`w-full ${getActionColor(selectedAction)} text-white px-4 py-2 rounded-lg transition-colors`}
            >
              Invia - {getActionLabel(selectedAction)}
            </button>
          </form>
        )}
      </div>

      {/* Ultima Scansione */}
      {lastScan && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Ultima Scansione</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Azione:</strong> {getActionLabel(lastScan.action)}</p>
            <p><strong>Utente:</strong> {lastScan.user.name}</p>
            <p><strong>Timestamp:</strong> {new Date(lastScan.timestamp).toLocaleString('it-IT')}</p>
          </div>
        </div>
      )}

      {/* Istruzioni */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Come funziona:</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Seleziona l'azione che vuoi registrare (Entrata, Uscita, Pausa)</li>
          <li>Premi "Avvia Scansione" per attivare la fotocamera</li>
          <li>Inquadra il QR code visualizzato dall'amministratore</li>
          <li>La presenza verrà registrata automaticamente</li>
        </ol>
      </div>
    </div>
  );
};

export default QRScannerPage;
