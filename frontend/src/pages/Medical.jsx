import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../hooks/useToast'
import { useEvents, publishEvent } from '../hooks/useEvents'
import { useAuth } from '../hooks/useAuth'
import { API } from '../lib/api'
import './Medical.css'

const TABS = [
    { id: 'vaccines', label: 'Vaccines', icon: '💉' },
    { id: 'deworming', label: 'Deworming', icon: '💊' },
    { id: 'visits', label: 'Vet History', icon: '🏥' },
]

const FORM_DEFAULTS = {
    vaccines: { name: '', date: '', veterinarian: '', notes: '' },
    deworming: { product: '', date: '', weight_at_time: '', next_due: '' },
    visits: { reason: '', date: '', veterinarian: '', diagnosis: '', notes: '' },
}

export default function Medical() {
    const { addToast } = useToast()
    const { addEvent } = useEvents()
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('vaccines')
    const [records, setRecords] = useState({ vaccines: [], deworming: [], visits: [] })
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState(FORM_DEFAULTS.vaccines)
    const [saving, setSaving] = useState(false)

    const fetchRecords = useCallback(async (tab) => {
        try {
            const res = await fetch(`${API.medical}/api/medical/${tab}?user_id=${user?.id || ''}`)
            if (res.ok) {
                const data = await res.json()
                setRecords((prev) => ({ ...prev, [tab]: data }))
            }
        } catch {
            // Service may be offline
        }
    }, [])

    useEffect(() => {
        fetchRecords(activeTab)
    }, [activeTab, fetchRecords])

    function handleTabChange(tab) {
        setActiveTab(tab)
        setShowForm(false)
        setFormData(FORM_DEFAULTS[tab])
    }

    function handleInputChange(field, value) {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    async function handleSave() {
        let isFormValid = false
        if (activeTab === 'vaccines') isFormValid = formData.name && formData.date
        else if (activeTab === 'deworming') isFormValid = formData.product && formData.date
        else if (activeTab === 'visits') isFormValid = formData.reason && formData.date

        if (!isFormValid) {
            addToast('Please fill in all required fields (Name/Reason and Date)', 'error')
            return
        }

        setSaving(true)

        // Optimistic update
        const optimisticRecord = {
            id: `temp-${Date.now()}`,
            ...formData,
            created_at: new Date().toISOString(),
            _optimistic: true,
        }
        setRecords((prev) => ({
            ...prev,
            [activeTab]: [optimisticRecord, ...prev[activeTab]],
        }))
        setShowForm(false)
        setFormData(FORM_DEFAULTS[activeTab])
        addToast('Record saved — syncing with distributed network…', 'success')

        try {
            const res = await fetch(`${API.medical}/api/medical/${activeTab}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, user_id: user?.id }),
            })

            if (res.ok) {
                const saved = await res.json()
                // Replace optimistic record with real one
                setRecords((prev) => ({
                    ...prev,
                    [activeTab]: prev[activeTab].map((r) =>
                        r.id === optimisticRecord.id ? saved : r
                    ),
                }))
                addEvent({
                    id: `medical-${Date.now()}`,
                    type: 'success',
                    title: 'Record Saved',
                    message: `New ${activeTab.slice(0, -1)} added to health passport`,
                    timestamp: new Date().toISOString(),
                })
                // Broadcast to Event Gateway (Supabase Edge Function)
                let evtType = 'Vacuna registrada'
                if (activeTab === 'deworming') evtType = 'Desparasitación registrada'
                if (activeTab === 'visits') evtType = 'Visita veterinaria registrada'

                publishEvent(`${activeTab}_created`, {
                    title: evtType,
                    message: `Se ha guardado tu registro exitosamente.`,
                })
                addToast('Data synchronized across the distributed network', 'info')
            } else {
                // Determine backend error
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.error || 'Failed to save record')
            }
        } catch (err) {
            // Remove optimistic record on failure
            setRecords((prev) => ({
                ...prev,
                [activeTab]: prev[activeTab].filter((r) => r.id !== optimisticRecord.id),
            }))
            addToast(err.message || 'Failed to save — please try again', 'error')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id) {
        // Optimistic delete
        const backup = records[activeTab]
        setRecords((prev) => ({
            ...prev,
            [activeTab]: prev[activeTab].filter((r) => r.id !== id),
        }))
        addToast('Record removed', 'info')

        try {
            const res = await fetch(`${API.medical}/api/medical/${activeTab}/${id}`, {
                method: 'DELETE',
            })
            if (!res.ok) throw new Error()
        } catch {
            setRecords((prev) => ({ ...prev, [activeTab]: backup }))
            addToast('Failed to delete — record restored', 'error')
        }
    }

    const currentRecords = records[activeTab]

    return (
        <div className="medical animate-fade-in">
            <header className="medical__header">
                <div>
                    <h1>Medical Ledger</h1>
                    <p>Your puppy's complete Health Passport</p>
                </div>
                <button
                    className="btn btn--primary"
                    onClick={() => { setShowForm(true); setFormData(FORM_DEFAULTS[activeTab]) }}
                    id="add-record-btn"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Record
                </button>
            </header>

            {/* Tab Navigation */}
            <div className="medical__tabs" role="tablist">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        className={`medical__tab ${activeTab === tab.id ? 'medical__tab--active' : ''}`}
                        onClick={() => handleTabChange(tab.id)}
                        id={`tab-${tab.id}`}
                    >
                        <span className="medical__tab-icon">{tab.icon}</span>
                        <span className="medical__tab-label">{tab.label}</span>
                        {records[tab.id].length > 0 && (
                            <span className="medical__tab-count">{records[tab.id].length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Add Record Form */}
            {showForm && (
                <div className="card medical__form animate-fade-in-up">
                    <h3 className="medical__form-title">
                        New {activeTab === 'visits' ? 'Vet Visit' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)} Record
                    </h3>

                    <div className="medical__form-grid">
                        {activeTab === 'vaccines' && (
                            <>
                                <div className="medical__form-field">
                                    <label htmlFor="vaccine-name">Vaccine Name</label>
                                    <input id="vaccine-name" className="input" placeholder="e.g. Rabies, Distemper" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} />
                                </div>
                                <div className="medical__form-field">
                                    <label htmlFor="vaccine-date">Date</label>
                                    <input id="vaccine-date" type="date" className="input" value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} />
                                </div>
                                <div className="medical__form-field">
                                    <label htmlFor="vaccine-vet">Veterinarian</label>
                                    <input id="vaccine-vet" className="input" placeholder="Dr. Smith" value={formData.veterinarian} onChange={(e) => handleInputChange('veterinarian', e.target.value)} />
                                </div>
                                <div className="medical__form-field">
                                    <label htmlFor="vaccine-notes">Notes</label>
                                    <input id="vaccine-notes" className="input" placeholder="Optional notes" value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} />
                                </div>
                            </>
                        )}

                        {activeTab === 'deworming' && (
                            <>
                                <div className="medical__form-field">
                                    <label htmlFor="deworm-product">Product</label>
                                    <input id="deworm-product" className="input" placeholder="e.g. Panacur, Drontal" value={formData.product} onChange={(e) => handleInputChange('product', e.target.value)} />
                                </div>
                                <div className="medical__form-field">
                                    <label htmlFor="deworm-date">Date Applied</label>
                                    <input id="deworm-date" type="date" className="input" value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} />
                                </div>
                                <div className="medical__form-field">
                                    <label htmlFor="deworm-weight">Weight at Time (kg)</label>
                                    <input id="deworm-weight" type="number" className="input" placeholder="15" value={formData.weight_at_time} onChange={(e) => handleInputChange('weight_at_time', e.target.value)} />
                                </div>
                                <div className="medical__form-field">
                                    <label htmlFor="deworm-next">Next Due</label>
                                    <input id="deworm-next" type="date" className="input" value={formData.next_due} onChange={(e) => handleInputChange('next_due', e.target.value)} />
                                </div>
                            </>
                        )}

                        {activeTab === 'visits' && (
                            <>
                                <div className="medical__form-field">
                                    <label htmlFor="visit-reason">Reason</label>
                                    <input id="visit-reason" className="input" placeholder="e.g. Annual checkup" value={formData.reason} onChange={(e) => handleInputChange('reason', e.target.value)} />
                                </div>
                                <div className="medical__form-field">
                                    <label htmlFor="visit-date">Date</label>
                                    <input id="visit-date" type="date" className="input" value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} />
                                </div>
                                <div className="medical__form-field">
                                    <label htmlFor="visit-vet">Veterinarian</label>
                                    <input id="visit-vet" className="input" placeholder="Dr. Smith" value={formData.veterinarian} onChange={(e) => handleInputChange('veterinarian', e.target.value)} />
                                </div>
                                <div className="medical__form-field">
                                    <label htmlFor="visit-diagnosis">Diagnosis</label>
                                    <input id="visit-diagnosis" className="input" placeholder="Healthy / Observation" value={formData.diagnosis} onChange={(e) => handleInputChange('diagnosis', e.target.value)} />
                                </div>
                                <div className="medical__form-field medical__form-field--full">
                                    <label htmlFor="visit-notes">Notes</label>
                                    <input id="visit-notes" className="input" placeholder="Additional notes" value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="medical__form-actions">
                        <button className="btn btn--ghost" onClick={() => setShowForm(false)}>Cancel</button>
                        <button className="btn btn--accent" onClick={handleSave} disabled={saving} id="save-record-btn">
                            {saving ? 'Saving…' : 'Save Record'}
                        </button>
                    </div>
                </div>
            )}

            {/* Records List */}
            <div className="medical__records">
                {currentRecords.length > 0 ? (
                    currentRecords.map((record, i) => (
                        <div
                            key={record.id}
                            className={`medical__record card ${record._optimistic ? 'medical__record--optimistic' : ''}`}
                            style={{ animationDelay: `${i * 0.05}s` }}
                        >
                            <div className="medical__record-badge">
                                <span className="medical__record-icon">
                                    {activeTab === 'vaccines' && '💉'}
                                    {activeTab === 'deworming' && '💊'}
                                    {activeTab === 'visits' && '🏥'}
                                </span>
                            </div>
                            <div className="medical__record-info">
                                <span className="medical__record-name">
                                    {record.name || record.product || record.reason || 'Untitled'}
                                </span>
                                <span className="medical__record-date">
                                    {record.date
                                        ? new Date(record.date).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })
                                        : 'No date'}
                                </span>
                                {record.veterinarian && (
                                    <span className="medical__record-vet">Dr. {record.veterinarian.replace(/^Dr\.?\s*/i, '')}</span>
                                )}
                            </div>
                            <div className="medical__record-actions">
                                {record._optimistic && (
                                    <span className="badge badge--info">Syncing…</span>
                                )}
                                <button
                                    className="btn btn--danger btn--sm"
                                    onClick={() => handleDelete(record.id)}
                                    aria-label="Delete record"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="medical__empty animate-fade-in-up">
                        <div className="medical__empty-illustration">
                            {/* Friendly puppy illustration (SVG) */}
                            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                                {/* Body */}
                                <ellipse cx="60" cy="78" rx="30" ry="25" fill="var(--color-primary-subtle)" stroke="var(--color-primary)" strokeWidth="1.5" />
                                {/* Head */}
                                <circle cx="60" cy="42" r="22" fill="var(--color-surface-alt)" stroke="var(--color-primary)" strokeWidth="1.5" />
                                {/* Ears */}
                                <ellipse cx="40" cy="28" rx="8" ry="14" fill="var(--color-primary-subtle)" stroke="var(--color-primary)" strokeWidth="1.5" transform="rotate(-15 40 28)" />
                                <ellipse cx="80" cy="28" rx="8" ry="14" fill="var(--color-primary-subtle)" stroke="var(--color-primary)" strokeWidth="1.5" transform="rotate(15 80 28)" />
                                {/* Eyes */}
                                <circle cx="52" cy="40" r="3" fill="var(--color-text)" />
                                <circle cx="68" cy="40" r="3" fill="var(--color-text)" />
                                <circle cx="53" cy="39" r="1" fill="white" />
                                <circle cx="69" cy="39" r="1" fill="white" />
                                {/* Nose */}
                                <ellipse cx="60" cy="48" rx="4" ry="3" fill="var(--color-text)" />
                                {/* Mouth */}
                                <path d="M56 51 Q60 55 64 51" stroke="var(--color-text)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                {/* Tail */}
                                <path d="M88 70 Q100 55 95 45" stroke="var(--color-primary)" strokeWidth="2" fill="none" strokeLinecap="round" />
                                {/* Paws */}
                                <ellipse cx="45" cy="100" rx="8" ry="5" fill="var(--color-surface-alt)" stroke="var(--color-primary)" strokeWidth="1.5" />
                                <ellipse cx="75" cy="100" rx="8" ry="5" fill="var(--color-surface-alt)" stroke="var(--color-primary)" strokeWidth="1.5" />
                            </svg>
                        </div>
                        <h3 className="medical__empty-title">Your health journey starts here</h3>
                        <p className="medical__empty-desc">
                            Add your first {activeTab === 'visits' ? 'vet visit' : activeTab.slice(0, -1)} record to start building your puppy's health passport.
                        </p>
                        <button
                            className="btn btn--primary"
                            onClick={() => { setShowForm(true); setFormData(FORM_DEFAULTS[activeTab]) }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add First Record
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
