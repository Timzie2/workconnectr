import { useAuth } from "../context/AuthContext"
import { useState, useEffect } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import supabase from "../supabaseClient"
import "../styles/auth.css"

function Login() {

  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const location = useLocation()
const [errorMsg, setErrorMsg] = useState("")
const [showReset, setShowReset] = useState(false)
const [resetEmail, setResetEmail] = useState("")
const [resetMsg, setResetMsg] = useState("")
const [resetLoading, setResetLoading] = useState(false)
const [resetSuccess, setResetSuccess] = useState(false)


  const handleLogin = async (e) => {
  e.preventDefault()
  setLoading(true)

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    // ❌ DO NOT NAVIGATE HERE

  } catch (err) {
    setErrorMsg(err.message)

    setTimeout(() => {
      setErrorMsg("")
    }, 3000)
  } finally {
    setLoading(false)
  }
}

const { user, role, loading: authLoading } = useAuth()
console.log("LOGIN STATE:", { user, role, authLoading })

useEffect(() => {
  // ✅ ONLY run on login page
  if (location.pathname !== "/login") return

  if (!authLoading && user && role) {
    console.log("REDIRECTING NOW:", role)

    if (role === "none") {
      navigate("/profile-setup", { replace: true })
    } else if (role === "worker") {
      navigate("/worker-dashboard", { replace: true })
    } else if (role === "contractor") {
      navigate("/contractor-dashboard", { replace: true })
    }
  }
}, [authLoading, user, role, location.pathname, navigate])

  const handleReset = async (e) => {
  e.preventDefault()
  setResetLoading(true)
  setResetMsg("")
  setResetSuccess(false)

  const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
    redirectTo: "http://localhost:5173/reset-password"
  })

  if (error) {
    setResetMsg(error.message)
  } else {
    setResetMsg("Check your email for reset link 📩")
    setResetSuccess(true)

    // 🔥 AUTO CLOSE AFTER SUCCESS
    setTimeout(() => {
      setShowReset(false)
      setResetEmail("")
      setResetMsg("")
      setResetSuccess(false)
    }, 2000)
  }

  setResetLoading(false)
}

const handleGoogleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "http://localhost:5173/login"
    }
  })

  if (error) {
    setErrorMsg(error.message)
  }
}

  return (
  <div className="login-page">

    <div className="login-card">

      <h1 className="app-title">WorkConnectr</h1>

      <p className="app-subtitle">
        Connect workers with contractors instantly
      </p>

      <h3>Log in to your account</h3>

      <form onSubmit={handleLogin}>

        <div className="input-group">
          <input
            type="email"
            placeholder=" "
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />
          <label>Email</label>
        </div>

        <div className="input-group password-group">
          <input
            type={showPassword ? "text" : "password"}
            placeholder=" "
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />
          <label>Password</label>

          <span
            className="toggle-password"
            onClick={() => setShowPassword(prev => !prev)}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <p
  className="forgot-password"
  onClick={() => setShowReset(true)}
>
  Forgot password?
</p>

        <button type="submit" disabled={loading}>
          {loading ? <span className="spinner"></span> : "Login"}
        </button>

      </form>

      <div className="divider">or</div>

      <button onClick={handleGoogleLogin} className="google-btn">
  Continue with Google
</button>

      <p className="login-footer">
        Don't have an account? <Link to="/register">Register</Link>
      </p>

    </div>

    {/* 🔔 ERROR TOAST */}
    {errorMsg && (
      <div className="toast">
        {errorMsg}
      </div>
    )}

    {/* 🔥 RESET PASSWORD MODAL */}
{showReset && (
  <div className="modal-overlay">

    <div className="modal">

      <div className="modal-header">
        <h3>Reset Password</h3>
        <span
          className="close-btn"
          onClick={() => setShowReset(false)}
        >
          ✖
        </span>
      </div>

      <form onSubmit={handleReset}>

        <div className="input-group">
          <input
            type="email"
            placeholder=" "
            value={resetEmail}
            onChange={(e)=>setResetEmail(e.target.value)}
            required
          />
          <label>Email</label>
        </div>

        <button
  type="submit"
  disabled={resetLoading || resetSuccess}
  className={resetSuccess ? "success-btn" : ""}
>
  {resetLoading
    ? <span className="spinner"></span>
    : resetSuccess
      ? "✅ Sent!"
      : "📩 Send Reset Link"
  }
</button>

      </form>

      {resetMsg && (
        <p className="reset-msg">{resetMsg}</p>
      )}

    </div>

  </div>
)}

  </div>
)
}

export default Login