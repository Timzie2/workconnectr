import { useState } from "react"
import supabase from "../supabaseClient"
import { useNavigate } from "react-router-dom"
import "../styles/auth.css"

function ResetPassword() {

  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password
    })

    if (error) {
      alert(error.message)
    } else {
      alert("Password updated successfully 🎉")
      navigate("/login")
    }

    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <h2>Set New Password</h2>

        <form onSubmit={handleUpdate}>

          <div className="input-group">
            <input
              type="password"
              placeholder=" "
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              required
            />
            <label>New Password</label>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>

        </form>

      </div>
    </div>
  )
}

export default ResetPassword