import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { attendanceAPI, shiftAPI, leaveRequestAPI } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  Play, 
  Square, 
  Coffee, 
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [todayStatus, setTodayStatus] = useState(null);
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carica stato di oggi
      const statusResponse = await attendanceAPI.getTodayStatus();
      setTodayStatus(statusResponse);

      // Carica prossimi turni (prossimi 7 giorni)
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      const shiftsResponse = await shiftAPI.getMyShifts(
        today.toISOString().split('T')[0],
        nextWeek.toISOString().split('T')[0]
      );
      setUpcomingShifts(shiftsResponse.shifts || []);

      // Carica richieste recenti
      const requestsResponse = await leaveRequestAPI.getMyRequests();
      setRecentRequests(requestsResponse.leave_requests?.slice(0, 3) || []);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceAction = async (action) => {
    try {
      setActionLoading(action);
      
      let response;
      switch (action) {
        case 'punch-in':
          response = await attendanceAPI.punchIn();
          break;
        case 'punch-out':
          response = await attendanceAPI.punchOut();
          break;
        case 'break-start':
          response = await attendanceAPI.breakStart();
          break;
        case 'break-end':
          response = await attendanceAPI.breakEnd();
          break;
      }
      
      // Ricarica lo stato
      const statusResponse = await attendanceAPI.getTodayStatus();
      setTodayStatus(statusResponse);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoading('');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">Presente</Badge>;
      case 'on_break':
        return <Badge className="bg-yellow-100 text-yellow-800">In Pausa</Badge>;
      case 'absent':
        return <Badge className="bg-gray-100 text-gray-800">Assente</Badge>;
      default:
        return <Badge variant="outline">Non iniziato</Badge>;
    }
  };

  const getLeaveStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Benvenuto, {user?.first_name}!</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sezione Orologio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Orologio Presenze
          </CardTitle>
          <CardDescription>
            Registra la tua presenza per oggi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Stato attuale:</span>
                {getStatusBadge(todayStatus?.status)}
              </div>
              
              {todayStatus?.attendance && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Entrata:</span>
                    <span className="font-mono">{formatTime(todayStatus.attendance.punch_in_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uscita:</span>
                    <span className="font-mono">{formatTime(todayStatus.attendance.punch_out_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pausa:</span>
                    <span className="font-mono">
                      {formatTime(todayStatus.attendance.break_start_time)} - {formatTime(todayStatus.attendance.break_end_time)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(!todayStatus?.attendance?.punch_in_time) && (
                <Button 
                  onClick={() => handleAttendanceAction('punch-in')}
                  disabled={actionLoading === 'punch-in'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Entrata
                </Button>
              )}
              
              {(todayStatus?.attendance?.punch_in_time && !todayStatus?.attendance?.punch_out_time) && (
                <Button 
                  onClick={() => handleAttendanceAction('punch-out')}
                  disabled={actionLoading === 'punch-out'}
                  variant="destructive"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Uscita
                </Button>
              )}
              
              {(todayStatus?.status === 'present') && (
                <Button 
                  onClick={() => handleAttendanceAction('break-start')}
                  disabled={actionLoading === 'break-start'}
                  variant="outline"
                >
                  <Coffee className="mr-2 h-4 w-4" />
                  Pausa
                </Button>
              )}
              
              {(todayStatus?.status === 'on_break') && (
                <Button 
                  onClick={() => handleAttendanceAction('break-end')}
                  disabled={actionLoading === 'break-end'}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Riprendi
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prossimi Turni */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Prossimi Turni
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingShifts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nessun turno programmato</p>
            ) : (
              <div className="space-y-3">
                {upcomingShifts.map((shift) => (
                  <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{formatDate(shift.date)}</p>
                      <p className="text-sm text-gray-600">
                        {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                      </p>
                      {shift.description && (
                        <p className="text-xs text-gray-500">{shift.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Richieste Recenti */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Richieste Recenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nessuna richiesta</p>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getLeaveStatusIcon(request.status)}
                        <p className="font-medium capitalize">{request.leave_type.replace('_', ' ')}</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatDate(request.start_date)} - {formatDate(request.end_date)}
                      </p>
                    </div>
                    <Badge 
                      variant={request.status === 'approved' ? 'default' : 
                              request.status === 'rejected' ? 'destructive' : 'secondary'}
                    >
                      {request.status === 'pending' ? 'In attesa' :
                       request.status === 'approved' ? 'Approvata' : 'Rifiutata'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

