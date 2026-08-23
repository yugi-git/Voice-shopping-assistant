export default function MicButton({ isListening, isSupported, onClick }) {
  return (
    <button
      type="button"
      className={`mic-button${isListening ? ' mic-button--listening' : ''}`}
      onClick={onClick}
      disabled={!isSupported}
      aria-pressed={isListening}
      aria-label={isListening ? 'Stop listening' : 'Start voice command'}
      title={isSupported ? undefined : 'Voice recognition is not supported in this browser'}
    >
      <span className="mic-button__ring" aria-hidden="true" />
      <span className="mic-button__ring mic-button__ring--delay" aria-hidden="true" />
      <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"
        />
        <path
          fill="currentColor"
          d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.93V20H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.07A7 7 0 0 0 19 11Z"
        />
      </svg>
    </button>
  )
}
