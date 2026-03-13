import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import './Login.css'

export default function Login() {
    const { signIn, signUp } = useAuth()
    const [isRegister, setIsRegister] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        if (!email || !password) {
            setError('Please fill in all fields')
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            setLoading(false)
            return
        }

        const { error: authError } = isRegister
            ? await signUp(email, password)
            : await signIn(email, password)

        if (authError) {
            setError(authError.message)
        } else if (isRegister) {
            setSuccess('Account created! Check your email to confirm, or try logging in.')
        }

        setLoading(false)
    }

    return (
        <div className="login animate-fade-in">
            <div className="login__card">
                <div className="login__logo">
                    <span className="login__logo-icon">🐾</span>
                    <h1>Pet Care Platform</h1>
                    <p>{isRegister ? 'Create your account' : 'Sign in to your account'}</p>
                </div>

                <form className="login__form" onSubmit={handleSubmit}>
                    <div className="login__field">
                        <label htmlFor="login-email">Email</label>
                        <input
                            id="login-email"
                            className="input"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                        />
                    </div>

                    <div className="login__field">
                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            className="input"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete={isRegister ? 'new-password' : 'current-password'}
                        />
                    </div>

                    {error && <div className="login__error">{error}</div>}
                    {success && <div className="login__error" style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)', color: '#22c55e' }}>{success}</div>}

                    <button
                        type="submit"
                        className="btn btn--primary btn--lg login__submit"
                        disabled={loading}
                    >
                        {loading && <span className="login__spinner" />}
                        {isRegister ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                <div className="login__toggle">
                    {isRegister ? 'Already have an account?' : "Don't have an account?"}
                    <button onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess('') }}>
                        {isRegister ? 'Sign In' : 'Register'}
                    </button>
                </div>
            </div>
        </div>
    )
}
