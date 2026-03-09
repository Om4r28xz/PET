import { useToast } from '../hooks/useToast'
import './Toast.css'

export default function Toast() {
    const { toasts, removeToast } = useToast()

    if (toasts.length === 0) return null

    return (
        <div className="toast-container" aria-live="polite">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`toast toast--${toast.type}`}
                    role="alert"
                >
                    <div className="toast__icon">
                        {toast.type === 'success' && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        )}
                        {toast.type === 'error' && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        )}
                        {toast.type === 'info' && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                        )}
                    </div>
                    <span className="toast__message">{toast.message}</span>
                    <button
                        className="toast__close"
                        onClick={() => removeToast(toast.id)}
                        aria-label="Dismiss notification"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    )
}
