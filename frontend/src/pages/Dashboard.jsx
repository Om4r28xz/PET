import { useState, useEffect, useRef, useCallback } from 'react'
import PulseIcon from '../components/PulseIcon'
import { useEvents } from '../hooks/useEvents'
import './Dashboard.css'

export default function Dashboard() {
    const { events, hasNewEvent, clearNewFlag } = useEvents()
    const [nutritionStatus, setNutritionStatus] = useState(null)
    const [nextVaccine, setNextVaccine] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showNotifPanel, setShowNotifPanel] = useState(false)
    const notifRef = useRef(null)

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
                const [nutritionRes, vaccineRes] = await Promise.allSettled([
                    fetch('/api/nutrition/calculate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ weight_kg: 15, age_months: 8, activity_level: 'moderate', diet_mode: 'kibble' }),
                    }).then(r => r.json()),
                    fetch('/api/medical/vaccines/next').then(r => r.json()),
                ])

                if (nutritionRes.status === 'fulfilled') setNutritionStatus(nutritionRes.value)
                if (vaccineRes.status === 'fulfilled') setNextVaccine(vaccineRes.value)
            } catch (err) {
                // Services may be offline during dev — show fallback
            } finally {
                setLoading(false)
            }
        }
        fetchDashboardData()
    }, [])

    const isOnTrack = nutritionStatus?.status === 'calculated'

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
                    <div className={`dashboard__status-orb ${isOnTrack ? 'dashboard__status-orb--on-track' : 'dashboard__status-orb--pending'}`}>
                        {isOnTrack ? (
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        ) : (
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        )}
                    </div>
                    <div className="dashboard__status-info">
                        <span className={`badge ${isOnTrack ? 'badge--success' : 'badge--info'}`}>
                            {isOnTrack ? 'On Track' : loading ? 'Loading...' : 'Awaiting Data'}
                        </span>
                        <h2 className="dashboard__status-heading">
                            {isOnTrack
                                ? 'Your puppy is on track today!'
                                : 'Set up your puppy\'s nutrition profile'}
                        </h2>
                        <p className="dashboard__status-desc">
                            {isOnTrack
                                ? `Recommended ${nutritionStatus.calories} kcal with a balanced ${nutritionStatus.growth_phase} diet`
                                : 'Navigate to Nutrition to calculate the ideal meal plan'}
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
