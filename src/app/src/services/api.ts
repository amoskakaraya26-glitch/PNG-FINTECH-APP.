import axios from 'axios';

const API_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.port === '3001' ? 'http://localhost:3000' : '');

const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 10000 });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePin: (data: any) => api.put('/auth/change-pin', data),
  completeOnboarding: () => api.post('/auth/complete-onboarding'),
};

export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  topUp: (data: any) => api.post('/wallet/topup', data),
};

export const transferAPI = {
  sendMoney: (data: any) => api.post('/transfers/send', data),
  getHistory: (params?: any) => api.get('/transfers/history', { params }),
  getAnalytics: (params?: any) => api.get('/transfers/analytics', { params }),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
};

export const contactsAPI = {
  getAll: () => api.get('/contacts'),
  add: (data: any) => api.post('/contacts', data),
  toggleFavorite: (id: string) => api.put(`/contacts/${id}/favorite`),
  delete: (id: string) => api.delete(`/contacts/${id}`),
};

export const billsAPI = {
  getBillers: () => api.get('/bills/billers'),
  payBill: (data: any) => api.post('/bills/pay', data),
  getHistory: () => api.get('/bills/history'),
};

export const scheduledAPI = {
  getAll: () => api.get('/scheduled'),
  create: (data: any) => api.post('/scheduled', data),
  cancel: (id: string) => api.delete(`/scheduled/${id}`),
};

export const referralAPI = {
  getInfo: () => api.get('/referrals'),
};

export const disputeAPI = {
  create: (data: any) => api.post('/disputes', data),
  getAll: () => api.get('/disputes'),
};

export const aiAPI = {
  chat: (message: string) => api.post('/ai/chat', { message }),
  getHistory: () => api.get('/ai/history'),
};

export const bankAPI = {


  linkAccount: (data:any) =>
    api.post(
      '/bank/link',
      data
    ),



  getAccounts: () =>
    api.get(
      '/bank/accounts'
    ),




  // BANK ENGINE

  getTransactions: () =>
    api.get(
      '/bank/transactions'
    ),



  cashIn: (data:any) =>
    api.post(
      '/bank/cash-in',
      data
    ),



  cashOut: (data:any) =>
    api.post(
      '/bank/cash-out',
      data
    ),


};

export const kycAPI = {
  submitKYC: (data: any) => api.post('/kyc/submit', data),
  verifyKYC: (data: any) => api.post('/kyc/verify', data),
  getStatus: () => api.get('/kyc/status'),
};

export const qrAPI = {
  generate: () => api.get('/qr/generate'),
  scan: (data: any) => api.post('/qr/scan', data),
};

export const merchantAPI = {

  getAll: () =>
    api.get('/merchant/list'),



  search: (q:string) =>
    api.get(
      '/merchant/search',
      {
        params:{
          q
        }
      }
    ),




  pay: (data:any) =>
    api.post(
      '/merchant/pay',
      data
    ),


};


export const adminAPI = {

  getDashboardStats: () =>
    api.get('/admin/stats'),


  getStats: () =>
    api.get('/admin/stats'),

  // BANK MONITOR

  getBankMonitor: () =>
    api.get('/admin/bank-monitor'),


  // PNG WALLET REVENUE ENGINE

  getRevenue: () =>
    api.get('/admin/revenue'),




  // COMPLIANCE / FRAUD MONITOR

  getCompliance: () =>
    api.get('/admin/compliance'),




  // BANK SETTLEMENT SYSTEM

  getSettlements: () =>
    api.get('/admin/settlements'),



  approveSettlement: (
    id:string
  ) =>

    api.patch(
      `/admin/settlements/${id}/approve`
    ),



  // USER MANAGEMENT

  getUsers: (params?:any) =>

    api.get(
      '/admin/users',
      {params}
    ),


  // TRANSACTION MONITORING

  getTransactions: (params?:any) =>

    api.get(
      '/admin/transactions',
      {params}
    ),

  updateUserStatus: (
    id:string,
    status:string
  ) =>

    api.patch(
      `/admin/users/${id}/status`,
      {status}
    ),

  // KYC REVIEW

  reviewKYC: (
    id:string,
    decision:string
  ) =>

    api.patch(
      `/admin/kyc/${id}`,
      {decision}
    ),

  // AUDIT LEDGER

  getAuditLogs: () =>
    api.get('/admin/audit-logs'),

  // REPORTING ENGINE


  getSecurity: () =>

api.get(

'/admin/security'

),

getFraud: () =>

api.get(

'/admin/fraud'

),

  getReports: () =>
    api.get('/admin/reports/summary'),


};