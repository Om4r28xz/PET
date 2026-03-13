import { useState, useEffect, useRef, useCallback } from 'react'
import PulseIcon from '../components/PulseIcon'
import { useEvents } from '../hooks/useEvents'
import { API } from '../lib/api'
import './Dashboard.css'

const DAILY_TIPS = [
    "Recuerda mantener siempre agua fresca y limpia al alcance de tu mascota.",
    "Un paseo diario de 30 minutos es ideal para la salud física y mental.",
    "La estimulación mental con juguetes es tan importante como el ejercicio.",
    "Un cepillado regular ayuda a mantener su pelaje sano y reduce la caída.",
    "Revisa sus orejas semanalmente para prevenir posibles infecciones.",
    "Mantener el peso ideal de tu mascota es clave para una vida larga y saludable."
]

export default function Dashboard() {
    const { events, hasNewEvent, clearNewFlag } = useEvents()
    const [nextVaccine, setNextVaccine] = useState(null)
    const [tipIndex, setTipIndex] = useState(0)
    const [showNotifPanel, setShowNotifPanel] = useState(false)
    const notifRef = useRef(null)

    useEffect(() => {
        setTipIndex(Math.floor(Math.random() * DAILY_TIPS.length))
    }, [])

    // Close panel on click outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifPanel(false)
            }
        }
        if (showNotifPanel) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showNotifPanel])

    const toggleNotifPanel = useCallback(() => {
        setShowNotifPanel((prev) => !prev)
        clearNewFlag()
    }, [clearNewFlag])

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const vaccineRes = await fetch(`${API.medical}/api/medical/vaccines/next`).then(r => r.json())
                if (vaccineRes) setNextVaccine(vaccineRes)
            } catch (err) {
                // Services may be offline during dev
            }
        }
        fetchDashboardData()
    }, [])

    return (
        <div className="dashboard animate-fade-in">
            {/* Header */}
            <header className="dashboard__header">
                <div>
                    <h1 className="dashboard__title">Dashboard</h1>
                    <p className="dashboard__subtitle">Your puppy's daily health overview</p>
                </div>
                <div className="notif-wrapper" ref={notifRef}>
                    <PulseIcon
                        hasNew={hasNewEvent}
                        count={events.length}
                        onClick={toggleNotifPanel}
                    />
                    {showNotifPanel && (
                        <div className="notif-panel animate-fade-in">
                            <div className="notif-panel__header">
                                <span className="notif-panel__title">Notifications</span>
                                <span className="notif-panel__count">{events.length}</span>
                            </div>
                            <div className="notif-panel__list">
                                {events.length > 0 ? (
                                    events.map((evt) => (
                                        <div key={evt.id} className="notif-panel__item">
                                            <div className={`dashboard__event-dot dashboard__event-dot--${evt.type}`} />
                                            <div className="notif-panel__item-info">
                                                <span className="notif-panel__item-title">{evt.title}</span>
                                                <span className="notif-panel__item-msg">{evt.message}</span>
                                            </div>
                                            <span className="notif-panel__item-time">
                                                {new Date(evt.timestamp).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="notif-panel__empty">
                                        <p>No notifications yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Daily Status Card */}
            <section className="dashboard__status-card card card--elevated" aria-label="Daily status">
                <div className="dashboard__status-indicator">
                    <div className="dashboard__status-orb dashboard__status-orb--on-track">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                            <line x1="16" y1="8" x2="2" y2="22" />
                            <line x1="17.5" y1="15" x2="9" y2="6.5" />
                        </svg>
                    </div>
                    <div className="dashboard__status-info">
                        <span className="badge badge--success">
                            Tip del Día
                        </span>
                        <h2 className="dashboard__status-heading">
                            Salud y Bienestar
                        </h2>
                        <p className="dashboard__status-desc">
                            {DAILY_TIPS[tipIndex]}
                        </p>
                    </div>
                </div>
            </section>

            {/* Two-column grid */}
            <div className="dashboard__grid">
                {/* Health Timeline */}
                <section className="card" aria-label="Health timeline">
                    <h3 className="section-title">Health Timeline</h3>
                    <div className="dashboard__timeline">
                        {nextVaccine && nextVaccine.name ? (
                            <div className="dashboard__timeline-item">
                                <div className="dashboard__timeline-line" />
                                <div className="dashboard__timeline-dot" />
                                <div className="dashboard__timeline-content">
                                    <span className="dashboard__timeline-date">
                                        {new Date(nextVaccine.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </span>
                                    <span className="dashboard__timeline-name">{nextVaccine.name}</span>
                                    <span className="badge badge--warning">Upcoming</span>
                                </div>
                            </div>
                        ) : (
                            <div className="dashboard__empty-timeline">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                                <p>No upcoming vaccines</p>
                                <span className="dashboard__empty-hint">Add records in the Medical section</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Real-Time Events */}
                <section className="card" aria-label="Real-time events">
                    <h3 className="section-title">Real-Time Alerts</h3>
                    <div className="dashboard__events">
                        {events.length > 0 ? (
                            events.slice(0, 5).map((evt) => (
                                <div key={evt.id} className="dashboard__event animate-fade-in">
                                    <div className={`dashboard__event-dot dashboard__event-dot--${evt.type}`} />
                                    <div className="dashboard__event-info">
                                        <span className="dashboard__event-title">{evt.title}</span>
                                        <span className="dashboard__event-msg">{evt.message}</span>
                                    </div>
                                    <span className="dashboard__event-time">
                                        {new Date(evt.timestamp).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="dashboard__empty-events">
                                <p>Listening for events…</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}
