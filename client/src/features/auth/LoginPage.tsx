import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import LeafIcon from '../../components/LeafIcon'
import './LoginPage.css'

function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const toggleMode = () => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'))
    setError(null)
    setNotice(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else if (!data.session) {
        setNotice('Account created — check your email to confirm it, then log in.')
      }
    }

    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-content">
        <div className="login-brand">
          <span className="login-brand-icon">
            <LeafIcon />
          </span>
          <h1>AnihanOS</h1>
        </div>
        <p className="login-tagline">Your farm, all in one place.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {mode === 'signin' && (
            <div className="login-forgot">
              <button type="button" className="login-link">
                Forgot password?
              </button>
            </div>
          )}

          {error && <p className="login-error">{error}</p>}
          {notice && <p className="login-notice">{notice}</p>}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <p className="login-signup">
          {mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button type="button" className="login-link" onClick={toggleMode}>
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" className="login-link" onClick={toggleMode}>
                Log In
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

export default LoginPage
