const STATUS_COPY = {
  connecting: 'Connecting…',
  syncing: 'Syncing…',
  synced: 'Synced',
  error: "Sync error — using this device's list",
}

export default function SyncBadge({ status }) {
  const label = STATUS_COPY[status] || null
  if (!label) return null
  return (
    <span className={`sync-badge sync-badge--${status}`} role="status">
      <span className="sync-badge__dot" aria-hidden="true" />
      {label}
    </span>
  )
}
