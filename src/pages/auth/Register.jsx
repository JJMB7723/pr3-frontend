import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Layout from '../../components/layout/Layout';

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await authService.register(formData);
      setSuccess('Account registered successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.join(', ') ||
        'Registration failed. Please check your details.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div
        style={{
          maxWidth: '520px',
          margin: '2rem auto',
        }}
      >
        <div className="pr3-card">
          <div
            style={{
              borderBottom: '1px solid rgba(23, 23, 23, 0.08)',
              paddingBottom: '1.2rem',
              marginBottom: '1.8rem',
            }}
          >
            <h2 style={{ fontSize: '1.6rem', letterSpacing: '-0.02em' }}>
              Create Account
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'rgba(23, 23, 23, 0.65)', marginTop: '0.3rem' }}>
              Register for Customer or Corporate Business procurement access
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: '1rem',
                border: '1px solid var(--color-coral)',
                backgroundColor: 'var(--color-coral-light)',
                color: 'var(--color-coral)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                fontSize: '0.88rem',
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                padding: '1rem',
                border: '1px solid var(--color-sage)',
                backgroundColor: 'var(--color-sage-light)',
                color: 'var(--color-sage)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                fontSize: '0.88rem',
                fontWeight: 700,
              }}
            >
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Jane"
                required
              />
              <Input
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Doe"
                required
              />
            </div>

            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jane@example.com"
              required
            />

            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1-555-0199"
            />

            <Input
              label="Password (min 8 characters)"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />

            {/* Account Type Selection - Material Supplier Removed */}
            <div style={{ marginBottom: '1.8rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Account Type *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="pr3-input"
                style={{ cursor: 'pointer', fontWeight: 600 }}
              >
                <option value="customer">Retail Customer</option>
                <option value="business">Corporate / Bulk Buyer</option>
              </select>
            </div>

            <Button
              type="submit"
              variant="coral"
              disabled={submitting}
              style={{ width: '100%', padding: '0.95rem' }}
            >
              {submitting ? 'Creating Account...' : 'Complete Registration'}
            </Button>
          </form>

          <div
            style={{
              marginTop: '1.8rem',
              paddingTop: '1.2rem',
              borderTop: '1px solid rgba(23, 23, 23, 0.08)',
              fontSize: '0.88rem',
              textAlign: 'center',
            }}
          >
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 800, color: 'var(--color-coral)' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
