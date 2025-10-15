import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { leaveRequestAPI } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar,
  User,
  FileText,
  AlertCircle
} from 'lucide-react';

const AdminLeaveRequestsPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      
      let response;
      if (filter === 'pending') {
        response = await leaveRequestAPI.getPendingRequests();
      } else if (filter === 'all') {
        response = await leaveRequestAPI.getAllRequests();
      } else {
        response = await leaveRequestAPI.getAllRequests(filter);
      }
      
      setRequests(response.leave_requests || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setActionLoading(requestId);
      setError('');
      await leaveRequestAPI.approveRequest(requestId);
      loadRequests();
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setActionLoading(requestId);
      setError('');
      await leaveRequestAPI.rejectRequest(requestId);
      loadRequests();
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'In attesa', variant: 'default', icon: Clock },
      approved: { label: 'Approvata', variant: 'success', icon: CheckCircle },
      rejected: { label: 'Rifiutata', variant: 'destructive', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getLeaveTypeLabel = (type) => {
    const types = {
      vacation: 'Ferie',
      sick: 'Malattia',
      personal: 'Permesso'
    };
    return types[type] || type;
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getStats = () => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento richieste...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Approvazione Richieste Assenza</h1>
        <p className="text-gray-600 mt-2">Gestisci le richieste di ferie, malattia e permessi dei dipendenti</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Totale Richieste</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600">In Attesa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">Approvate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">Rifiutate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
              size="sm"
            >
              <Clock className="h-4 w-4 mr-2" />
              In Attesa ({stats.pending})
            </Button>
            <Button
              variant={filter === 'approved' ? 'default' : 'outline'}
              onClick={() => setFilter('approved')}
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approvate ({stats.approved})
            </Button>
            <Button
              variant={filter === 'rejected' ? 'default' : 'outline'}
              onClick={() => setFilter('rejected')}
              size="sm"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rifiutate ({stats.rejected})
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Tutte ({stats.total})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Nessuna richiesta trovata</p>
                <p className="text-sm mt-1">
                  {filter === 'pending' 
                    ? 'Non ci sono richieste in attesa di approvazione'
                    : `Non ci sono richieste con stato "${filter}"`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">
                        {getLeaveTypeLabel(request.leave_type)}
                      </CardTitle>
                      {getStatusBadge(request.status)}
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {request.user?.first_name} {request.user?.last_name} ({request.user?.username})
                    </CardDescription>
                  </div>
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(request.id)}
                        disabled={actionLoading === request.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approva
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(request.id)}
                        disabled={actionLoading === request.id}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rifiuta
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Date Range */}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Periodo:</span>
                    <span>
                      {formatDate(request.start_date)} - {formatDate(request.end_date)}
                    </span>
                    <Badge variant="outline">
                      {calculateDays(request.start_date, request.end_date)} giorni
                    </Badge>
                  </div>

                  {/* Reason */}
                  {request.reason && (
                    <div className="text-sm">
                      <span className="font-medium">Motivazione:</span>
                      <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded-md">
                        {request.reason}
                      </p>
                    </div>
                  )}

                  {/* Request Date */}
                  <div className="text-xs text-gray-500">
                    Richiesta inviata il {formatDate(request.created_at)}
                  </div>

                  {/* Approval Info */}
                  {request.status !== 'pending' && request.reviewed_at && (
                    <div className="text-xs text-gray-500 border-t pt-2">
                      {request.status === 'approved' ? 'Approvata' : 'Rifiutata'} il {formatDate(request.reviewed_at)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminLeaveRequestsPage;
