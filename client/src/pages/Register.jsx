import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import supabase from "../supabaseClient"
import "../styles/auth.css"

function Register(){

const [name,setName] = useState("")
const [email,setEmail] = useState("")
const [password,setPassword] = useState("")
const [role,setRole] = useState("worker")
const [showPassword, setShowPassword] = useState(false)
const [loading, setLoading] = useState(false)
const [errorMsg, setErrorMsg] = useState("")

const navigate = useNavigate()

const registerUser = async (e) => {
  e.preventDefault()
  setLoading(true)
  setErrorMsg("")

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    console.log("SIGN UP RESULT:", { data, error })

    if (error) {
      if (
  error.message.toLowerCase().includes("already registered")
) {
  setErrorMsg(
    "An account with this email already exists"
  )
} else {
  setErrorMsg(error.message)
}
      return
    }

    if (!data?.user?.id) {
  setErrorMsg("Authentication failed")
  setLoading(false)
  return
}

    const { error: insertError } = await supabase
  .from("users")
  .insert([
    {
      id: data.user.id,

      full_name: name,

      email,

      role,

      is_online: false,

      location: "",

      skills: "",

      experience: "",

      avatar_url: "",

      profile_completed: false
    },
  ])

    if (insertError) {

  // rollback auth session if db insert fails
  await supabase.auth.signOut()

  console.error("INSERT ERROR:", insertError)

  setErrorMsg(insertError.message)

  return
}

    setErrorMsg("Registration successful 🎉")
    setTimeout(() => navigate("/login"), 1500)
  } catch (err) {
    console.error("REGISTER CATCH ERROR:", err)
    setErrorMsg("Registration failed")
  } finally {
    setLoading(false)
    setTimeout(() => setErrorMsg(""), 3000)
  }
}

return (
  <div className="login-page">

    <div className="login-card">

      <h1 className="app-title">WorkConnectr</h1>

      <p className="app-subtitle">
        Create your account
      </p>

      <h3>Register</h3>

      <form onSubmit={registerUser}>

        {/* NAME */}
        <div className="input-group">
          <input
            type="text"
            placeholder=" "
            value={name}
            onChange={(e)=>setName(e.target.value)}
            required
          />
          <label>Name</label>
        </div>

        {/* EMAIL */}
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

        {/* PASSWORD */}
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

        {/* ROLE */}
        <div className="input-group">
          <select
            value={role}
            onChange={(e)=>setRole(e.target.value)}
          >
            <option value="worker">Worker</option>
            <option value="contractor">Contractor</option>
          </select>
        </div>

        <button type="submit" disabled={loading}>
  {loading ? <span className="spinner"></span> : "Register"}
</button>
<p className="login-footer">
  Already have an account? <Link to="/login">Login</Link>
</p>

      </form>

    </div>

    {/* 🔔 ERROR / SUCCESS TOAST (CORRECT PLACE) */}
    {errorMsg && (
      <div className="toast">
        {errorMsg}
      </div>
    )}

  </div>
)

}

export default Register