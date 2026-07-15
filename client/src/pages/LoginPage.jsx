import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BlastDoor from '../components/BlastDoor';
import TerminalField from '../components/TerminalField';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [doorState, setDoorState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  function updateField(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setDoorState('authenticating');

    try {
      const [data] = await Promise.all([login(form), wait(900)]);
      setDoorState('granted');
      setTimeout(() => navigate('/dashboard'), 900);
      return data;
    } catch (err) {
      setErrorMessage(err.message || 'Access denied.');
      setDoorState('denied');
      setTimeout(() => setDoorState('idle'), 900);
    }
  }

  return (
    <BlastDoor
      doorState={doorState}
      statusText={doorState === 'denied' ? 'ACCESS DENIED' : undefined}
      panel={
        <form onSubmit={handleSubmit}>
          {errorMessage && <div className="form-error-banner">{errorMessage}</div>}
          <TerminalField
            label="EMAIL"
            type="email"
            required
            value={form.email}
            onChange={updateField('email')}
            disabled={doorState === 'authenticating'}
          />
          <TerminalField
            label="PASSWORD"
            type="password"
            required
            value={form.password}
            onChange={updateField('password')}
            disabled={doorState === 'authenticating'}
          />
          <button className="terminal-submit" type="submit" disabled={doorState === 'authenticating'}>
            {doorState === 'authenticating' ? 'SCANNING…' : 'REQUEST ACCESS'}
          </button>
          <span className="terminal-switch">
            No credentials on file? <Link to="/register">Enroll here</Link>
          </span>
        </form>
      }
    >
      <DashboardPreviewPlaceholder />
    </BlastDoor>
  );
}

function DashboardPreviewPlaceholder() {
  return null;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
