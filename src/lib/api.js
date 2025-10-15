// API utility functions for the attendance system

// ============================================================================
// CONFIGURAZIONE URL BASE API
// ============================================================================
// L'URL del backend viene letto dalle variabili d'ambiente di Vercel.
// In sviluppo locale, userà il valore di fallback.
//
// IMPORTANTE: Imposta la variabile d'ambiente `VITE_API_BASE_URL` nel tuo progetto Vercel
// con l'URL del tuo backend su Railway (es: https://tuo-backend.up.railway.app/api)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

console.log(`API Base URL: ${API_BASE_URL}`);

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Errore di rete o risposta non JSON' }));
    throw new Error(error.error || `Errore ${response.status}: ${response.statusText}`);
  }
  // Se la risposta non ha contenuto (es. 204 No Content), ritorna un oggetto vuoto
  if (response.status === 204) {
      return {};
  }
  return response.json();
};

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(response);
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  }
};

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  updateProfile: async (userId, userData) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  getAllUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Attendance API
export const attendanceAPI = {
  punchIn: async () => {
    const response = await fetch(`${API_BASE_URL}/attendance/punch-in`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  punchOut: async () => {
    const response = await fetch(`${API_BASE_URL}/attendance/punch-out`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  breakStart: async () => {
    const response = await fetch(`${API_BASE_URL}/attendance/break-start`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  breakEnd: async () => {
    const response = await fetch(`${API_BASE_URL}/attendance/break-end`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getTodayStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/attendance/today-status`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getMyAttendance: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await fetch(`${API_BASE_URL}/attendance/my-attendance?${params}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getAllAttendance: async (startDate, endDate, userId) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (userId) params.append('user_id', userId);
    
    const response = await fetch(`${API_BASE_URL}/attendance/all?${params}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Shift API
export const shiftAPI = {
  getMyShifts: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await fetch(`${API_BASE_URL}/shifts/my-shifts?${params}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  createShift: async (shiftData) => {
    const response = await fetch(`${API_BASE_URL}/shifts/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(shiftData)
    });
    return handleResponse(response);
  },

  updateShift: async (shiftId, shiftData) => {
    const response = await fetch(`${API_BASE_URL}/shifts/${shiftId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(shiftData)
    });
    return handleResponse(response);
  },

  deleteShift: async (shiftId) => {
    const response = await fetch(`${API_BASE_URL}/shifts/${shiftId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getAllShifts: async (startDate, endDate, userId) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (userId) params.append('user_id', userId);
    
    const response = await fetch(`${API_BASE_URL}/shifts/all?${params}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Leave Request API
export const leaveRequestAPI = {
  createRequest: async (requestData) => {
    const response = await fetch(`${API_BASE_URL}/leave-requests/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestData)
    });
    return handleResponse(response);
  },

  getMyRequests: async (status) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    const response = await fetch(`${API_BASE_URL}/leave-requests/my-requests?${params}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  updateRequest: async (requestId, requestData) => {
    const response = await fetch(`${API_BASE_URL}/leave-requests/${requestId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestData)
    });
    return handleResponse(response);
  },

  approveRequest: async (requestId) => {
    const response = await fetch(`${API_BASE_URL}/leave-requests/${requestId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  rejectRequest: async (requestId) => {
    const response = await fetch(`${API_BASE_URL}/leave-requests/${requestId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getPendingRequests: async () => {
    const response = await fetch(`${API_BASE_URL}/leave-requests/pending`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getAllRequests: async (status, userId) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (userId) params.append('user_id', userId);
    
    const response = await fetch(`${API_BASE_URL}/leave-requests/all?${params}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};


// QR Code API
export const qrCodeAPI = {
  generateQRCode: async (description, expiresHours) => {
    const response = await fetch(`${API_BASE_URL}/qr-code/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ description, expires_hours: expiresHours })
    });
    return handleResponse(response);
  },

  getActiveQRCode: async () => {
    const response = await fetch(`${API_BASE_URL}/qr-code/active`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  scanQRCode: async (token, userId, action) => {
    const response = await fetch(`${API_BASE_URL}/qr-code/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, user_id: userId, action })
    });
    return handleResponse(response);
  },

  getQRCodeHistory: async () => {
    const response = await fetch(`${API_BASE_URL}/qr-code/history`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  deactivateQRCode: async (qrId) => {
    const response = await fetch(`${API_BASE_URL}/qr-code/${qrId}/deactivate`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

