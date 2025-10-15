import React, { useState, useEffect } from 'react';
import { shiftAPI } from '../lib/api';

const ShiftsPage = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadShifts();
  }, [filters]);

  const loadShifts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await shiftAPI.getMyShifts(filters.startDate, filters.endDate);
      setShifts(response.shifts || []);
    } catch (err) {
      setError('Errore nel caricamento dei turni: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (datetime) => {
    return new Date(datetime).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  const getShiftStatus = (shift) => {
    const now = new Date();
    const shiftDate = new Date(shift.date);
    const startTime = new Date(shift.start_time);
    const endTime = new Date(shift.end_time);

    // Confronta solo la data, non l'ora
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    shiftDate.setHours(0, 0, 0, 0);

    if (shiftDate < today) {
      return { status: 'completed', label: 'Completato', color: 'bg-green-100 text-green-800' };
    } else if (shiftDate > today) {
      return { status: 'upcoming', label: 'Programmato', color: 'bg-blue-100 text-blue-800' };
    } else {
      // È oggi
      if (now < startTime) {
        return { status: 'today-upcoming', label: 'Oggi - In attesa', color: 'bg-yellow-100 text-yellow-800' };
      } else if (now >= startTime && now <= endTime) {
        return { status: 'in-progress', label: 'In corso', color: 'bg-orange-100 text-orange-800' };
      } else {
        return { status: 'today-completed', label: 'Oggi - Completato', color: 'bg-green-100 text-green-800' };
      }
    }
  };

  const groupShiftsByDate = (shifts) => {
    const grouped = {};
    shifts.forEach(shift => {
      const date = shift.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(shift);
    });
    return grouped;
  };

  const groupedShifts = groupShiftsByDate(shifts);
  const sortedDates = Object.keys(groupedShifts).sort((a, b) => new Date(b) - new Date(a));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">I Miei Turni</h1>
        <p className="text-gray-600">Visualizza i tuoi turni programmati e completati</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filtri */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtri</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Inizio
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Fine
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ startDate: '', endDate: '' })}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Pulisci Filtri
            </button>
          </div>
        </div>
      </div>

      {/* Statistiche Rapide */}
      {shifts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-blue-600">
              {shifts.filter(s => getShiftStatus(s).status === 'upcoming' || getShiftStatus(s).status === 'today-upcoming').length}
            </div>
            <div className="text-sm text-gray-600">Turni Programmati</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-orange-600">
              {shifts.filter(s => getShiftStatus(s).status === 'in-progress').length}
            </div>
            <div className="text-sm text-gray-600">Turni in Corso</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-green-600">
              {shifts.filter(s => getShiftStatus(s).status === 'completed' || getShiftStatus(s).status === 'today-completed').length}
            </div>
            <div className="text-sm text-gray-600">Turni Completati</div>
          </div>
        </div>
      )}

      {/* Lista Turni */}
      {shifts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-gray-500">
            <p className="text-lg mb-2">Nessun turno trovato</p>
            <p className="text-sm">Non hai turni programmati nel periodo selezionato.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">
                  {formatDate(date)}
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {groupedShifts[date].map((shift) => {
                  const shiftStatus = getShiftStatus(shift);
                  return (
                    <div key={shift.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="text-lg font-semibold text-gray-900">
                            {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${shiftStatus.color}`}>
                            {shiftStatus.label}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Durata: {calculateDuration(shift.start_time, shift.end_time)}
                        </div>
                      </div>
                      
                      {shift.description && (
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Descrizione:</strong> {shift.description}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div>
                          Creato: {new Date(shift.created_at).toLocaleDateString('it-IT')}
                        </div>
                        {shiftStatus.status === 'in-progress' && (
                          <div className="text-orange-600 font-medium">
                            ⏰ Turno in corso
                          </div>
                        )}
                        {shiftStatus.status === 'today-upcoming' && (
                          <div className="text-yellow-600 font-medium">
                            🕐 Inizia tra poco
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nota informativa */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> I turni vengono assegnati dagli amministratori. 
          Se hai domande sui tuoi turni o necessiti di modifiche, contatta il tuo supervisore.
        </p>
      </div>
    </div>
  );
};

export default ShiftsPage;

