import { useState } from "react"
import supabase from "../supabaseClient"
import "../styles/auth.css"

function ForgotPassword() {

  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:5173/reset-password"
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage("Check your email for reset link 📩")
    }

    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <h2>Reset Password</h2>

        <form onSubmit={handleReset}>

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

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

        </form>

        {message && <p style={{ marginTop: "10px" }}>{message}</p>}

      </div>
    </div>
  )
}

export default ForgotPassword