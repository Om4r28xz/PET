import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'
import Dashboard from './pages/Dashboard'
import Nutrition from './pages/Nutrition'
import Medical from './pages/Medical'
import Login from './pages/Login'
import { ToastProvider } from './hooks/useToast.jsx'
import { AuthProvider, useAuth } from './hooks/useAuth'
import './App.css'

function AppContent() {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>Loading…</p>
            </div>
        )
    }

    if (!user) {
        return <Login />
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-main">
                <div className="app-content">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/nutrition" element={<Nutrition />} />
                        <Route path="/medical" element={<Medical />} />
                    </Routes>
                </div>
            </main>
            <Toast />
        </div>
    )
}

export default function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <AppContent />
            </ToastProvider>
        </AuthProvider>
    )
}
