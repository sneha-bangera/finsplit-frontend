import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../services/authService';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const res = await registerUser(data);
      login(res);
      toast.success('Account created! Welcome to FinSplit.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.email
        || 'Registration failed. Try again.';
      toast.error(msg);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create account</h1>
        <p className="subtitle">Start tracking and splitting expenses</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label>Full name</label>
            <input type="text" placeholder="Rahul Shah"
              className={errors.name ? 'error' : ''} {...register('name')} />
            {errors.name && <p className="error-msg">{errors.name.message}</p>}
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="rahul@example.com"
              className={errors.email ? 'error' : ''} {...register('email')} />
            {errors.email && <p className="error-msg">{errors.email.message}</p>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="At least 6 characters"
              className={errors.password ? 'error' : ''} {...register('password')} />
            {errors.password && <p className="error-msg">{errors.password.message}</p>}
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}