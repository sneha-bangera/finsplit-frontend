import api from './api';

export const getMyGroups    = ()                => api.get('/groups').then(r => r.data);
export const getGroup       = (id)              => api.get(`/groups/${id}`).then(r => r.data);
export const createGroup    = (data)            => api.post('/groups', data).then(r => r.data);
export const addMember      = (id, data)        => api.post(`/groups/${id}/members`, data).then(r => r.data);
export const removeMember   = (gId, mId)        => api.delete(`/groups/${gId}/members/${mId}`);
export const getExpenses    = (id)              => api.get(`/groups/${id}/expenses`).then(r => r.data);
export const addExpense     = (id, data)        => api.post(`/groups/${id}/expenses`, data).then(r => r.data);
export const deleteExpense  = (gId, eId)        => api.delete(`/groups/${gId}/expenses/${eId}`);
export const getBalances    = (id)              => api.get(`/groups/${id}/balances`).then(r => r.data);
export const markSettled    = (gId, splitId)    => api.patch(`/groups/${gId}/splits/${splitId}/settle`);