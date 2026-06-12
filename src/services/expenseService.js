import api from './api';

export const getCategories = () => api.get('/categories').then(r => r.data);
export const getSummary    = () => api.get('/expenses/summary').then(r => r.data);
export const getExpenses   = (params) => api.get('/expenses', { params }).then(r => r.data);
export const createExpense = (data) => api.post('/expenses', data).then(r => r.data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data).then(r => r.data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);

export const uploadReceipt = (id, file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/expenses/${id}/receipt`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export const exportExpenses = (from, to) => {
  const params = {};
  if (from) params.from = from;
  if (to)   params.to   = to;
  return api.get('/export/expenses', {
    params,
    responseType: 'blob',
  }).then(r => r.data);
};