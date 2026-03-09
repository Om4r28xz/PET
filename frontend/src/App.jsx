import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'
import Dashboard from './pages/Dashboard'
import Nutrition from './pages/Nutrition'
import Medical from './pages/Medical'
import { ToastProvider } from './hooks/useToast.jsx'
import './App.css'

export default function App() {
    return (
        <ToastProvider>
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
        </ToastProvider>
    )
}
