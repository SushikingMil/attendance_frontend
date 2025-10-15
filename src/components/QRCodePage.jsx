import React, { useState, useEffect } from 'react';
import { qrCodeAPI } from '../lib/api';
import QRCode from 'qrcode';

const QRCodePage = () => {
  const [activeQRCode, setActiveQRCode] = useState(null);
  const [qrCodeHistory, setQRCodeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrCodeImage, setQRCodeImage] = useState('');
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [formData, setFormData] = useState({
    description: 'QR Code per presenze',
    expires_hours: 24
  });

  useEffect(() => {
    loadQRCodeData();
  }, []);

  const loadQRCodeData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Carica QR code attivo e cronologia
      const [activeResponse, historyResponse] = await Promise.all([
        qrCodeAPI.getActiveQRCode().catch(() => ({ qr_code: null })),
        qrCodeAPI.getQRCodeHistory()
      ]);

      setActiveQRCode(activeResponse.qr_code);
      setQRCodeHistory(historyResponse.qr_codes || []);

      // Genera l'immagine QR se c'è un QR code attivo
      if (activeResponse.qr_code) {
        await generateQRCodeImage(activeResponse.qr_code.token);
      } else {
        setQRCodeImage('');
      }
    } catch (err) {
      setError('Errore nel caricamento dei dati: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodeImage = async (token) => {
    try {
      // Genera l'immagine QR code
      const qrDataURL = await QRCode.toDataURL(token, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQRCodeImage(qrDataURL);
    } catch (err) {
      console.error('Errore nella generazione dell\'immagine QR:', err);
    }
  };

  const handleGenerateQRCode = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      setLoading(true);

      const response = await qrCodeAPI.generateQRCode(
        formData.description,
        parseInt(formData.expires_hours)
      );

      setSuccess(response.message);
      setShowGenerateForm(false);
      await loadQRCodeData();
    } catch (err) {
      setError('Errore nella generazione del QR code: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateQRCode = async (qrId) => {
    if (!window.confirm('Sei sicuro di voler disattivare questo QR code?')) return;

    try {
      setError('');
      await qrCodeAPI.deactivateQRCode(qrId);
      setSuccess('QR code disattivato con successo!');
      await loadQRCodeData();
    } catch (err) {
      setError('Errore nella disattivazione: ' + err.message);
    }
  };

  const formatDateTime = (datetime) => {
    return new Date(datetime).toLocaleString('it-IT');
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getStatusBadge = (qrCode) => {
    if (!qrCode.is_active) {
      return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">Disattivato</span>;
    }
    if (isExpired(qrCode.expires_at)) {
      return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">Scaduto</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Attivo</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestione QR Code</h1>
        <p className="text-gray-600">Genera e gestisci il QR code unico per le presenze</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* QR Code Attivo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">QR Code Attivo</h2>
            <button
              onClick={() => setShowGenerateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Genera Nuovo QR
            </button>
          </div>

          {activeQRCode ? (
            <div className="text-center">
              <div className="mb-4">
                {getStatusBadge(activeQRCode)}
              </div>
              
              {qrCodeImage && (
                <div className="mb-4">
                  <img 
                    src={qrCodeImage} 
                    alt="QR Code" 
                    className="mx-auto border rounded-lg shadow-sm"
                  />
                </div>
              )}

              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Descrizione:</strong> {activeQRCode.description}</p>
                <p><strong>Creato:</strong> {formatDateTime(activeQRCode.created_at)}</p>
                {activeQRCode.expires_at && (
                  <p><strong>Scade:</strong> {formatDateTime(activeQRCode.expires_at)}</p>
                )}
                <p><strong>Token:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-xs">{activeQRCode.token}</code></p>
              </div>

              <button
                onClick={() => handleDeactivateQRCode(activeQRCode.id)}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Disattiva QR Code
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">Nessun QR code attivo</p>
              <p className="text-sm">Genera un nuovo QR code per permettere ai dipendenti di registrare le presenze</p>
            </div>
          )}
        </div>

        {/* Istruzioni per l'uso */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Come Funziona</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">1</div>
              <div>
                <p className="font-medium text-gray-900">Genera un QR Code</p>
                <p>Crea un nuovo QR code unico che sostituisce automaticamente quello precedente.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">2</div>
              <div>
                <p className="font-medium text-gray-900">Posiziona il QR Code</p>
                <p>Stampa o visualizza il QR code in un luogo accessibile ai dipendenti (ingresso, bacheca, ecc.).</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">3</div>
              <div>
                <p className="font-medium text-gray-900">Scansione con App Mobile</p>
                <p>I dipendenti scansionano il QR code con l'app mobile per registrare entrate, uscite e pause.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">4</div>
              <div>
                <p className="font-medium text-gray-900">Controllo Automatico</p>
                <p>Il sistema registra automaticamente le presenze e le associa al dipendente corretto.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Solo un QR code può essere attivo alla volta. 
              Generando un nuovo QR code, quello precedente viene automaticamente disattivato.
            </p>
          </div>
        </div>
      </div>

      {/* Form Generazione QR Code */}
      {showGenerateForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Genera Nuovo QR Code</h2>
          <form onSubmit={handleGenerateQRCode}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descrizione del QR code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scadenza (ore)
                </label>
                <select
                  value={formData.expires_hours}
                  onChange={(e) => setFormData({...formData, expires_hours: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1">1 ora</option>
                  <option value="8">8 ore</option>
                  <option value="24">24 ore</option>
                  <option value="72">3 giorni</option>
                  <option value="168">1 settimana</option>
                  <option value="">Nessuna scadenza</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Genera QR Code
              </button>
              <button
                type="button"
                onClick={() => setShowGenerateForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cronologia QR Code */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Cronologia QR Code ({qrCodeHistory.length})</h2>
        </div>
        
        {qrCodeHistory.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Nessun QR code nella cronologia.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrizione
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scadenza
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creato da
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {qrCodeHistory.map((qrCode) => (
                  <tr key={qrCode.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(qrCode)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {qrCode.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDateTime(qrCode.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {qrCode.expires_at ? formatDateTime(qrCode.expires_at) : 'Mai'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {qrCode.creator_name || 'Sconosciuto'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {qrCode.is_active && !isExpired(qrCode.expires_at) && (
                        <button
                          onClick={() => handleDeactivateQRCode(qrCode.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Disattiva
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodePage;

