import './BlastDoor.css';

const BOLT_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const LIGHT_ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

export default function BlastDoor({ doorState, statusText, children, panel }) {
  const isOpen = doorState === 'granted';
  const bolted = doorState === 'idle';

  return (
    <div className={`vault-frame state-${doorState}`}>
      <div className="door-reveal" aria-hidden={!isOpen}>
        {children}
      </div>

      <div className={`vault-door-wrap ${isOpen ? 'open' : ''}`}>
        <div className="vault-ring-outer">
          <div className="vault-rivets" />
          {LIGHT_ANGLES.map((angle) => (
            <div key={angle} className="light-pivot" style={{ transform: `rotate(${angle}deg)` }}>
              <span className="rim-light" />
            </div>
          ))}
          {BOLT_ANGLES.map((angle) => (
            <div key={angle} className="bolt-pivot" style={{ transform: `rotate(${angle}deg)` }}>
              <span className={`vault-bolt ${bolted ? '' : 'retracted'}`} />
            </div>
          ))}
        </div>
        <div className="vault-ring-inner" />
        <div className="vault-hub">
          <div className="vault-hub-spokes" />
          <div className="vault-hub-cap" />
        </div>
      </div>

      {!isOpen && (
        <div className="scanner-panel">
          <ReadoutLine doorState={doorState} statusText={statusText} />
          {panel}
        </div>
      )}
    </div>
  );
}

function ReadoutLine({ doorState, statusText }) {
  const labels = {
    idle: 'VAULT SEALED — AWAITING CREDENTIALS',
    authenticating: 'VERIFYING…',
    denied: 'ACCESS DENIED',
    granted: 'ACCESS GRANTED',
  };
  return (
    <div className={`readout readout-${doorState}`}>
      <span className="readout-dot" />
      {statusText || labels[doorState] || labels.idle}
    </div>
  );
}
