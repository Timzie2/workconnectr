import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import supabase from "../supabaseClient"

function Login() {

  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // ✅ LOGIN WITH SUPABASE AUTH
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      const user = data.user

      // ✅ GET USER PROFILE FROM USERS TABLE
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()

      // 🚨 IF USER NOT IN USERS TABLE → GO TO PROFILE SETUP
      if (profileError || !profile) {
        navigate("/profile-setup")
        return
      }

      // 🚨 IF PROFILE NOT COMPLETE
      if (!profile.role) {
        navigate("/profile-setup")
        return
      }

      // ✅ ROLE-BASED REDIRECT
      if (profile.role === "worker") {
        navigate("/worker-dashboard")
      } else {
        navigate("/contractor-dashboard")
      }

    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
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

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Continue"}
          </button>

        </form>

        <div className="divider">or</div>

        <button className="google-btn">
          Continue with Google
        </button>

        <p className="login-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>

      </div>
    </div>
  )
}

export default Login