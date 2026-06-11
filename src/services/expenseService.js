import api from './api';

export const getCategories = () => api.get('/categories').then(r => r.data);
export const getSummary    = () => api.get('/expenses/summary').then(r => r.data);
export const getExpenses   = (params) => api.get('/expenses', { params }).then(r => r.data);
export const createExpense = (data) => api.post('/expenses', data).then(r => r.data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data).then(r => r.data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);