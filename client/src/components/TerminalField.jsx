export default function TerminalField({ label, error, ...inputProps }) {
  return (
    <label className="terminal-field">
      <span className="terminal-field-label">{label}</span>
      <input className="terminal-field-input" {...inputProps} />
      {error && <span className="terminal-field-error">{error}</span>}
    </label>
  );
}
