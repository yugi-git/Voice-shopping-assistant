export default function CommandLog({ interimTranscript, entries }) {
  return (
    <div className="command-log">
      <div className="command-log__live" aria-live="polite">
        {interimTranscript ? (
          <span className="command-log__interim">"{interimTranscript}"</span>
        ) : (
          <span className="command-log__placeholder">Tap the mic and speak a command</span>
        )}
      </div>
      {entries.length > 0 && (
        <ul className="command-log__history">
          {entries.map((entry) => (
            <li key={entry.id} className={`command-log__entry command-log__entry--${entry.status}`}>
              <span className="command-log__icon" aria-hidden="true">
                {entry.status === 'ok' ? '✓' : '!'}
              </span>
              <span>{entry.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
