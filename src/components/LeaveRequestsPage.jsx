import { useState, useEffect } from 'react';
import { leaveRequestAPI } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar
} from 'lucide-react';

const LeaveRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    leave_type: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await leaveRequestAPI.getMyRequests();
      setRequests(response.leave_requests || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await leaveRequestAPI.createRequest(formData);
      setDialogOpen(false);
      setFormData({
        start_date: '',
        end_date: '',
        leave_type: '',
        reason: ''
      });
      loadRequests();
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approvata</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rifiutata</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">In attesa</Badge>;
    }
  };

  const getLeaveTypeLabel = (type) => {
    switch (type) {
      case 'holiday':
        return 'Ferie';
      case 'permission':
        return 'Permesso';
      case 'sick_leave':
        return 'Malattia';
      default:
        return type;
    }
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
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
          <h1 className="text-3xl font-bold text-gray-900">Richieste di Assenza</h1>
          <p className="text-gray-600">Gestisci le tue richieste di ferie, permessi e malattie</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuova Richiesta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nuova Richiesta di Assenza</DialogTitle>
              <DialogDescription>
                Compila il modulo per richiedere ferie, permessi o giorni di malattia
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Data inizio</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleFormChange('start_date', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Data fine</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleFormChange('end_date', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="leave_type">Tipo di assenza</Label>
                <Select value={formData.leave_type} onValueChange={(value) => handleFormChange('leave_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona il tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="holiday">Ferie</SelectItem>
                    <SelectItem value="permission">Permesso</SelectItem>
                    <SelectItem value="sick_leave">Malattia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="reason">Motivazione (opzionale)</Label>
                <Textarea
                  id="reason"
                  placeholder="Inserisci una motivazione..."
                  value={formData.reason}
                  onChange={(e) => handleFormChange('reason', e.target.value)}
                  rows={3}
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Invio...' : 'Invia Richiesta'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Lista richieste */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Le mie richieste
          </CardTitle>
          <CardDescription>
            {requests.length} richieste totali
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nessuna richiesta presente</p>
              <p className="text-sm text-gray-400">Clicca su "Nuova Richiesta" per iniziare</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(request.status)}
                        <h3 className="font-medium">{getLeaveTypeLabel(request.leave_type)}</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(request.start_date)} - {formatDate(request.end_date)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Durata:</span> {calculateDays(request.start_date, request.end_date)} giorni
                        </div>
                        <div>
                          <span className="font-medium">Richiesta il:</span> {formatDate(request.created_at)}
                        </div>
                      </div>
                      
                      {request.reason && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-gray-700">Motivazione:</span>
                          <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                        </div>
                      )}
                      
                      {request.status !== 'pending' && request.approved_at && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">
                            {request.status === 'approved' ? 'Approvata' : 'Rifiutata'} il:
                          </span> {formatDate(request.approved_at)}
                        </div>
                      )}
                    </div>
                    
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Modifica
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveRequestsPage;

