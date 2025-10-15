import { useState, useEffect } from 'react';
import { attendanceAPI } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Download } from 'lucide-react';

const AttendancePage = () => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadAttendances();
  }, []);

  const loadAttendances = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getMyAttendance(
        filters.startDate || undefined,
        filters.endDate || undefined
      );
      setAttendances(response.attendances || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const applyFilters = () => {
    loadAttendances();
  };

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '' });
    setTimeout(loadAttendances, 100);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const calculateWorkingHours = (attendance) => {
    if (!attendance.punch_in_time || !attendance.punch_out_time) {
      return '--';
    }
    
    const punchIn = new Date(attendance.punch_in_time);
    const punchOut = new Date(attendance.punch_out_time);
    let totalMinutes = (punchOut - punchIn) / (1000 * 60);
    
    // Sottrai il tempo di pausa se presente
    if (attendance.break_start_time && attendance.break_end_time) {
      const breakStart = new Date(attendance.break_start_time);
      const breakEnd = new Date(attendance.break_end_time);
      const breakMinutes = (breakEnd - breakStart) / (1000 * 60);
      totalMinutes -= breakMinutes;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">Presente</Badge>;
      case 'on_break':
        return <Badge className="bg-yellow-100 text-yellow-800">In Pausa</Badge>;
      case 'absent':
        return <Badge className="bg-gray-100 text-gray-800">Completato</Badge>;
      default:
        return <Badge variant="outline">Sconosciuto</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Le mie presenze</h1>
          <p className="text-gray-600">Visualizza e gestisci il tuo storico presenze</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Esporta
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filtri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">Data inizio</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data fine</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters}>Applica</Button>
              <Button variant="outline" onClick={clearFilters}>Reset</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabella presenze */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Storico Presenze
          </CardTitle>
          <CardDescription>
            {attendances.length} record trovati
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendances.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nessuna presenza trovata per il periodo selezionato</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Data</th>
                    <th className="text-left py-3 px-4 font-medium">Entrata</th>
                    <th className="text-left py-3 px-4 font-medium">Uscita</th>
                    <th className="text-left py-3 px-4 font-medium">Pausa</th>
                    <th className="text-left py-3 px-4 font-medium">Ore Lavorate</th>
                    <th className="text-left py-3 px-4 font-medium">Stato</th>
                    <th className="text-left py-3 px-4 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((attendance) => (
                    <tr key={attendance.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{formatDate(attendance.date)}</td>
                      <td className="py-3 px-4 font-mono">{formatTime(attendance.punch_in_time)}</td>
                      <td className="py-3 px-4 font-mono">{formatTime(attendance.punch_out_time)}</td>
                      <td className="py-3 px-4 font-mono">
                        {attendance.break_start_time && attendance.break_end_time ? (
                          `${formatTime(attendance.break_start_time)} - ${formatTime(attendance.break_end_time)}`
                        ) : (
                          '--'
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono">{calculateWorkingHours(attendance)}</td>
                      <td className="py-3 px-4">{getStatusBadge(attendance.status)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {attendance.notes || '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendancePage;

