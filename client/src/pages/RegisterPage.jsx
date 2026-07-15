import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BlastDoor from '../components/BlastDoor';
import TerminalField from '../components/TerminalField';
import { useAuth } from '../hooks/useAuth';


function validateForm(form) {
  const errors = {};

  if (!form.username || form.username.trim().length < 3) {
    errors.username = 'Must be at least 3 characters.';
  } else if (form.username.length > 30) {
    errors.username = 'Must be at most 30 characters.';
  } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
    errors.username = 'Letters, numbers, and underscores only.';
  }

  if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!form.password || form.password.length < 8) {
    errors.password = 'Must be at least 8 characters.';
  } else if (!/[A-Z]/.test(form.password)) {
    errors.password = 'Must contain at least one uppercase letter.';
  } else if (!/[0-9]/.test(form.password)) {
    errors.password = 'Must contain at least one number.';
  }

  if (!form.address || form.address.trim().length < 5) {
    errors.address = 'Must be at least 5 characters.';
  }

  return errors;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '', address: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [doorState, setDoorState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  function updateField(key) {
    return (e) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setFieldErrors((errs) => (errs[key] ? { ...errs, [key]: undefined } : errs));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const localErrors = validateForm(form);
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      setDoorState('denied');
      setTimeout(() => setDoorState('idle'), 900);
      return;
    }

    setFieldErrors({});
    setDoorState('authenticating');

    try {
      await register(form);
      setDoorState('idle');
      setSuccessMessage('Identity enrolled. Redirecting to access terminal…');
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setErrorMessage(err.message || 'Enrollment failed.');
      setDoorState('denied');
      setTimeout(() => setDoorState('idle'), 900);
    }
  }

  return (
    <BlastDoor
      doorState={doorState}
      statusText={
        doorState === 'authenticating'
          ? 'ENROLLING IDENTITY…'
          : doorState === 'denied'
            ? 'ENROLLMENT FAILED'
            : 'NEW IDENTITY ENROLLMENT'
      }
      panel={
        <form onSubmit={handleSubmit}>
          {errorMessage && <div className="form-error-banner">{errorMessage}</div>}
          {successMessage && <div className="form-success-banner">{successMessage}</div>}
          <TerminalField
            label="USERNAME"
            required
            value={form.username}
            onChange={updateField('username')}
            error={fieldErrors.username}
            disabled={doorState === 'authenticating'}
          />
          <TerminalField
            label="EMAIL"
            type="email"
            required
            value={form.email}
            onChange={updateField('email')}
            error={fieldErrors.email}
            disabled={doorState === 'authenticating'}
          />
          <TerminalField
            label="PASSWORD"
            type="password"
            required
            value={form.password}
            onChange={updateField('password')}
            error={fieldErrors.password}
            disabled={doorState === 'authenticating'}
          />
          <TerminalField
            label="ADDRESS"
            required
            value={form.address}
            onChange={updateField('address')}
            error={fieldErrors.address}
            disabled={doorState === 'authenticating'}
          />
          <button className="terminal-submit" type="submit" disabled={doorState === 'authenticating'}>
            {doorState === 'authenticating' ? 'ENROLLING…' : 'ENROLL IDENTITY'}
          </button>
          <span className="terminal-switch">
            Already enrolled? <Link to="/">Return to terminal</Link>
          </span>
        </form>
      }
    />
  );
}