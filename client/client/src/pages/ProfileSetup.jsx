import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import { useAuth } from "../context/AuthContext" // ✅ NEW

function ProfileSetup() {

  const navigate = useNavigate()

  const { user, loading: authLoading } = useAuth() // ✅ GLOBAL AUTH

  const [name, setName] = useState("")
  const [role, setRole] = useState("worker")
  const [skills, setSkills] = useState("")
  const [loading, setLoading] = useState(false)

  // ✅ REDIRECT IF NOT LOGGED IN
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login")
    }
  }, [user, authLoading])

  // ✅ HANDLE PROFILE SAVE
  const handleSaveProfile = async (e) => {
    e.preventDefault()

    if (!user) return

    setLoading(true)

    const { error } = await supabase
      .from("users")
      .update({
        full_name: name,
        role: role,
        skills: skills
      })
      .eq("id", user.id)

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    alert("Profile saved!")

    // ✅ REDIRECT BASED ON ROLE
    if (role === "worker") {
      navigate("/worker-dashboard")
    } else {
      navigate("/contractor-dashboard")
    }
  }

  // ✅ AUTH LOADING
  if (authLoading) {
    return <div className="login-page">Loading...</div>
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <h2>Complete Your Profile</h2>

        <form onSubmit={handleSaveProfile}>

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            required
          />

          <select value={role} onChange={(e)=>setRole(e.target.value)}>
            <option value="worker">Worker</option>
            <option value="contractor">Contractor</option>
          </select>

          <input
            type="text"
            placeholder="Skills (e.g electrician, plumber)"
            value={skills}
            onChange={(e)=>setSkills(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Continue"}
          </button>

        </form>

      </div>
    </div>
  )
}

export default ProfileSetup