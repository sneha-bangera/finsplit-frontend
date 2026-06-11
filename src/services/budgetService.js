import api from './api';

export const setBudget     = (data)   => api.post('/budgets', data).then(r => r.data);
export const getBudgets    = (month)  => api.get('/budgets', { params: { monthYear: month } }).then(r => r.data);
export const getAnalytics  = ()       => api.get('/budgets/analytics').then(r => r.data);