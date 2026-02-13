import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// Auth API
export const authAPI = {
    login: (credentials: any) => api.post('/auth/login', credentials),
    register: (data: any) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data: any) => api.put('/auth/me', data)
};

// Client Panel API
export const clientAPI = {
    getDashboard: () => api.get('/client/dashboard'),
    getCases: (params?: any) => api.get('/client/cases', { params }),
    submitCase: (data: any) => api.post('/client/cases', data),
    getRecommendations: (caseId: string) => api.get(`/client/cases/${caseId}/recommendations`),
    hireAdvocate: (caseId: string, advocateId: string) => api.post(`/client/cases/${caseId}/hire`, { advocateId })
};

// Advocate Panel API
export const advocatePanelAPI = {
    getDashboard: () => api.get('/advocate/dashboard'),
    getCases: (params?: any) => api.get('/advocate/cases', { params }),
    getRequests: () => api.get('/advocate/case-requests'),
    respondToRequest: (caseId: string, action: 'accept' | 'reject', reason?: string) =>
        api.post(`/advocate/cases/${caseId}/respond`, { action, reason }),
    updateCaseStatus: (caseId: string, status: string, notes?: string) =>
        api.put(`/advocate/cases/${caseId}/status`, { status, notes }),
    getAnalytics: (period?: string) => api.get('/advocate/analytics', { params: { period } }),
    updateProfile: (data: any) => api.put('/advocate/profile', data)
};

// Public Advocate Search API
export const advocatesAPI = {
    getAll: (params?: any) => api.get('/advocates', { params }),
    getById: (id: string) => api.get(`/advocates/${id}`),
    getSpecializations: () => api.get('/advocates/specializations'),
    // Deprecated dashboard call, mapped to new API for compatibility if needed
    getDashboardStats: () => api.get('/advocate/dashboard').then(res => ({ data: { data: res.data.data.stats } }))
};

// Documents API
export const documentsAPI = {
    upload: (caseId: string, file: File, analyze: boolean = false) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('analyze', String(analyze));
        return api.post(`/documents/cases/${caseId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    list: (caseId: string) => api.get(`/documents/cases/${caseId}`),
    listAll: (params?: any) => api.get('/documents', { params }),
    download: (id: string) => api.get(`/documents/${id}/download`, { responseType: 'blob' })
};

// AI API
export const aiAPI = {
    chat: (message: string, caseId?: string) => api.post('/ai/chat', { message, caseId }),
    getLogs: (params?: any) => api.get('/ai/logs', { params })
};

// Notifications API
export const notificationsAPI = {
    getAll: (params?: any) => api.get('/notifications', { params }),
    markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all')
};

// Admin API
export const adminAPI = {
    getDashboard: () => api.get('/admin/dashboard'),
    getUsers: (params?: any) => api.get('/admin/users', { params }),
    updateUserStatus: (userId: string, status: string, reason?: string) => api.put(`/admin/users/${userId}/status`, { action: status, reason }),
    getAdvocates: (params?: any) => api.get('/admin/advocates/pending', { params }), // Currently only pending
    getPendingAdvocates: (params?: any) => api.get('/admin/advocates/pending', { params }),
    verifyAdvocate: (advocateId: string, action: string, reason?: string) => api.put(`/admin/advocates/${advocateId}/verify`, { action, reason }),
    getSettings: () => api.get('/admin/settings'),
    updateSettings: (updates: any[]) => api.put('/admin/settings', { updates }),
    getComplaints: (params?: any) => api.get('/admin/complaints', { params }),
    resolveComplaint: (complaintId: string, action: string, notes?: string) => api.put(`/admin/complaints/${complaintId}/resolve`, { action, notes })
};

// Shared Cases API
export const casesAPI = {
    getAll: (params?: any) => api.get('/cases', { params }), // Use shared endpoint
    getById: (id: string) => api.get(`/cases/${id}`), // Still useful for general fetch
    submit: (data: any) => clientAPI.submitCase(data),
    assignAdvocate: (caseId: string, advocateId: string) => clientAPI.hireAdvocate(caseId, advocateId),
    updateStatus: (caseId: string, status: string, notes?: string) => advocatePanelAPI.updateCaseStatus(caseId, status, notes)
};
