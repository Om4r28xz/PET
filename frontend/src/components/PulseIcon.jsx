import './PulseIcon.css'

/**
 * Glowing pulse icon that activates when hasNew is true.
 * Shows real-time event gateway status.
 */
export default function PulseIcon({ hasNew = false, count = 0, onClick }) {
    return (
        <button
            className={`pulse-icon ${hasNew ? 'pulse-icon--active' : ''}`}
            onClick={onClick}
            aria-label={`${count} notifications${hasNew ? ', new notification' : ''}`}
            title="Real-time alerts"
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {hasNew && <span className="pulse-icon__dot" />}
            {count > 0 && <span className="pulse-icon__count">{count > 9 ? '9+' : count}</span>}
        </button>
    )
}
