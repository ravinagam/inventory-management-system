import { useState } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { Package, User, Mail, Lock, AtSign, Eye, EyeOff } from 'lucide-react'

const FAKE_DOMAIN = '@inveman.app'

async function resolveAuthEmail(usernameOrEmail) {
  if (usernameOrEmail.includes('@')) return usernameOrEmail
  const snap = await getDoc(doc(db, 'usernames', usernameOrEmail.toLowerCase()))
  if (!snap.exists()) return null
  return snap.data().authEmail
}

async function isUsernameTaken(username) {
  const snap = await getDoc(doc(db, 'usernames', username.toLowerCase()))
  return snap.exists()
}

function friendlyError(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':      return 'Incorrect password.'
    case 'auth/user-not-found':      return 'No account found.'
    case 'auth/email-already-in-use':return 'This username or email is already registered.'
    case 'auth/weak-password':       return 'Password must be at least 6 characters.'
    case 'auth/invalid-email':       return 'Invalid email address.'
    case 'auth/too-many-requests':   return 'Too many attempts. Please try again later.'
    default:                         return 'Something went wrong. Please try again.'
  }
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, type = 'text', icon, badge, hint, autoComplete, autoCapitalize, required }) {
  const [showPw, setShowPw] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPw ? 'text' : 'password') : type

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{label}</label>
        {badge && (
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', background: '#f1f5f9', padding: '2px 8px', borderRadius: '999px' }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          {icon}
        </div>
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          style={{
            width: '100%', paddingLeft: '36px', paddingRight: isPassword ? '40px' : '14px',
            paddingTop: '12px', paddingBottom: '12px', borderRadius: '12px',
            border: '1.5px solid #e5e7eb', fontSize: '14px', background: '#f9fafb',
            color: '#111827', outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.target.style.borderColor = '#1d4ed8'; e.target.style.background = '#fff' }}
          onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb' }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPw((v) => !v)}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {showPw ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
          </button>
        )}
      </div>
      {hint && <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{hint}</p>}
    </div>
  )
}

function ErrorBox({ msg }) {
  return (
    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>
      {msg}
    </div>
  )
}

function SubmitBtn({ loading, label }) {
  return (
    <button type="submit" disabled={loading} style={{
      background: 'linear-gradient(135deg, #1e3a5f, #1d4ed8)',
      color: '#fff', border: 'none', padding: '14px', borderRadius: '14px',
      fontSize: '14px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.65 : 1, boxShadow: '0 4px 14px rgba(29,78,216,0.35)',
      letterSpacing: '-0.2px', width: '100%',
    }}>
      {loading ? 'Please wait…' : label}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Login() {
  const [mode, setMode] = useState('login')

  // Login fields
  const [loginId, setLoginId]         = useState('')
  const [loginPw, setLoginPw]         = useState('')

  // Register fields
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername]       = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirmPw, setConfirmPw]     = useState('')

  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function switchMode(m) { setMode(m); setError('') }

  async function handleLogin(e) {
    e.preventDefault()
    if (!loginId.trim()) { setError('Enter your username or email.'); return }
    setError('')
    setLoading(true)
    try {
      const authEmail = await resolveAuthEmail(loginId.trim())
      if (!authEmail) {
        setError('No account found with this username.')
        return
      }
      await signInWithEmailAndPassword(auth, authEmail, loginPw)
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!displayName.trim())                  { setError('Display name is required.'); return }
    if (!username.trim())                     { setError('Username is required.'); return }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) { setError('Username: 3–20 chars, letters/numbers/underscore only.'); return }
    if (password.length < 6)                  { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPw)               { setError('Passwords do not match.'); return }

    setError('')
    setLoading(true)
    try {
      if (await isUsernameTaken(username)) {
        setError('This username is already taken. Choose another.')
        return
      }

      const authEmail = email.trim() || `${username.toLowerCase()}${FAKE_DOMAIN}`
      const cred = await createUserWithEmailAndPassword(auth, authEmail, password)

      // Set display name on Firebase Auth user
      await updateProfile(cred.user, { displayName: displayName.trim() })

      // Save username → authEmail mapping (public lookup for login)
      await setDoc(doc(db, 'usernames', username.toLowerCase()), { authEmail })

      // Save full profile
      await setDoc(doc(db, 'users', cred.user.uid), {
        username: username.toLowerCase(),
        displayName: displayName.trim(),
        email: email.trim() || null,
        authEmail,
        createdAt: serverTimestamp(),
      })
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f1f5f9',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
        <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #1d4ed8)', padding: '16px', borderRadius: '20px', boxShadow: '0 6px 24px rgba(29,78,216,0.4)' }}>
          <Package size={34} color="#fff" />
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#111827', letterSpacing: '-0.5px', margin: 0 }}>Inventory Pro</h1>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Manage your shop with ease</p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '390px', background: '#fff',
        borderRadius: '24px', boxShadow: '0 4px 30px rgba(0,0,0,0.09)',
        padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px',
      }}>
        {/* Tab switcher */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '14px', padding: '4px', gap: '4px' }}>
          {[['login', 'Sign In'], ['register', 'Register']].map(([m, label]) => (
            <button key={m} onClick={() => switchMode(m)} style={{
              flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              background: mode === m ? '#fff' : 'transparent',
              color: mode === m ? '#111827' : '#9ca3af',
              boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Sign In form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field
              label="Username or Email"
              icon={<AtSign size={15} color="#9ca3af" />}
              value={loginId} onChange={setLoginId}
              placeholder="Enter your username or email"
              autoComplete="username"
            />
            <Field
              label="Password"
              icon={<Lock size={15} color="#9ca3af" />}
              value={loginPw} onChange={setLoginPw}
              placeholder="••••••••" type="password"
              autoComplete="current-password"
            />
            {error && <ErrorBox msg={error} />}
            <SubmitBtn loading={loading} label="Sign In" />
          </form>
        )}

        {/* Register form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field
              label="Display Name" required
              icon={<User size={15} color="#9ca3af" />}
              value={displayName} onChange={setDisplayName}
              placeholder="Your full name"
              autoCapitalize="words" autoComplete="name"
            />
            <Field
              label="Username" required
              icon={<AtSign size={15} color="#9ca3af" />}
              value={username}
              onChange={(v) => setUsername(v.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
              placeholder="unique_username"
              hint="3–20 chars · letters, numbers, underscore"
              autoComplete="username"
            />
            <Field
              label="Email" badge="Optional"
              icon={<Mail size={15} color="#9ca3af" />}
              value={email} onChange={setEmail}
              placeholder="you@example.com" type="email"
              autoComplete="email"
            />
            <Field
              label="Password" required
              icon={<Lock size={15} color="#9ca3af" />}
              value={password} onChange={setPassword}
              placeholder="Min 6 characters" type="password"
              autoComplete="new-password"
            />
            <Field
              label="Confirm Password" required
              icon={<Lock size={15} color="#9ca3af" />}
              value={confirmPw} onChange={setConfirmPw}
              placeholder="Re-enter password" type="password"
              autoComplete="new-password"
            />
            {error && <ErrorBox msg={error} />}
            <SubmitBtn loading={loading} label="Create Account" />
          </form>
        )}
      </div>
    </div>
  )
}
