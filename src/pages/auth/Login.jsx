import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Layout from '../../components/layout/Layout';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await authService.login(formData);
      // Response: { message, token, user }
      login(res.token, res.user);

      // Redirect user according to role
      const role = res.user.role;
      switch (role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'business':
          navigate('/business/dashboard');
          break;
        case 'supplier':
          navigate('/supplier/dashboard');
          break;
        case 'delivery':
          navigate('/delivery/dashboard');
          break;
        case 'customer':
        default:
          navigate('/');
          break;
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Authentication failed. Please check your credentials.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div
        style={{
          maxWidth: '440px',
          margin: '3rem auto',
        }}
      >
        <div className="pr3-card">
          <div
            style={{
              borderBottom: '1px solid var(--color-black)',
              paddingBottom: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <h2 style={{ fontSize: '1.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sign In
            </h2>
            <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
              Enter your credentials to access the PR3 platform
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: '0.8rem',
                border: '1px solid var(--color-black)',
                backgroundColor: 'var(--color-ivory)',
                marginBottom: '1.2rem',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="user@example.com"
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--color-black)',
              fontSize: '0.85rem',
              textAlign: 'center',
            }}
          >
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight: 700 }}>
              Register here
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;

