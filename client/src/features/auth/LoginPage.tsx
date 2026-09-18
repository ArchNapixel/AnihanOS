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
  const [googleLoading, setGoogleLoading] = useState(false)

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

  const handleGoogleSignIn = async () => {
    setError(null)
    setNotice(null)
    setGoogleLoading(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })

    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
    // On success the browser navigates to Google, so no further state update happens here.
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

        <button
          type="button"
          className="login-google"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
        >
          <GoogleIcon />
          {googleLoading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        <div className="login-divider">
          <span>or</span>
        </div>

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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.61z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.19l-2.92-2.26c-.81.54-1.84.87-3.04.87-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  )
}

export default LoginPage
