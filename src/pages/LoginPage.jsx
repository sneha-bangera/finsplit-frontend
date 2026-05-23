import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/authService';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const res = await loginUser(data);
      login(res);
      toast.success(`Welcome back, ${res.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Sign in</h1>
        <p className="subtitle">Welcome back to FinSplit</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="rahul@example.com"
              className={errors.email ? 'error' : ''} {...register('email')} />
            {errors.email && <p className="error-msg">{errors.email.message}</p>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Your password"
              className={errors.password ? 'error' : ''} {...register('password')} />
            {errors.password && <p className="error-msg">{errors.password.message}</p>}
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-link">
          No account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}