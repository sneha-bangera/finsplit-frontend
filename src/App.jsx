
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import BudgetPage from './pages/BudgetPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/expenses" element={
            <ProtectedRoute><ExpensesPage /></ProtectedRoute>
          } />
          <Route path="/budgets" element={
            <ProtectedRoute><BudgetPage /></ProtectedRoute>
          } />
          <Route path="/groups" element={
            <ProtectedRoute><GroupsPage /></ProtectedRoute>
          } />
          <Route path="/groups/:groupId" element={
            <ProtectedRoute><GroupDetailPage /></ProtectedRoute>
          } />
          <Route path="*" element={<NotFoundPage/>} />
        </Routes>

        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </BrowserRouter>
  );
}