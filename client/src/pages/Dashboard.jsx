import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import * as authApi from '../api/authApi';
import './Dashboard.css';

export default function Dashboard() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(session?.user || null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }
    authApi
      .getProfile(session.user.id, session.accessToken)
      .then((data) => setProfile(data.user))
      .catch((err) => setError(err.message));
  }, [session, navigate]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  if (!session) return null;

  return (
    <div className="control-room">
      <div className="control-room-scanlines" aria-hidden="true" />
      <div className="control-room-content">
        <span className="control-room-eyebrow">CONTROL ROOM</span>
        <h1>Welcome, {profile?.username || session.user.username}</h1>
        <p className="control-room-sub">Identity verified. Session active.</p>

        {error && <div className="form-error-banner">{error}</div>}

        <dl className="control-room-facts">
          <div>
            <dt>EMAIL</dt>
            <dd>{profile?.email}</dd>
          </div>
          <div>
            <dt>ADDRESS</dt>
            <dd>{profile?.address}</dd>
          </div>
          <div>
            <dt>USER ID</dt>
            <dd>{profile?.id}</dd>
          </div>
        </dl>

        <button className="terminal-submit control-room-logout" onClick={handleLogout}>
          SEAL DOOR / LOG OUT
        </button>
      </div>
    </div>
  );
}
