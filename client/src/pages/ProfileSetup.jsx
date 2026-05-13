import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import { useAuth } from "../context/AuthContext" // ✅ NEW
import "../styles/ProfileSetup.css"

function ProfileSetup() {

  const navigate = useNavigate()

  const { user, loading: authLoading } = useAuth() // ✅ GLOBAL AUTH

  const [name, setName] = useState("")
  const [skills, setSkills] = useState("")
  const [loading, setLoading] = useState(false)
  const [userRole, setUserRole] = useState("")

  // ✅ REDIRECT IF NOT LOGGED IN
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login")
    }
  }, [user, authLoading])

  useEffect(() => {

  if (!user) return

  const getUserRole = async () => {

    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    console.log("ROLE DATA:", data)

if (data?.role) {
  setUserRole(data.role)
}
  }

  getUserRole()

}, [user])

  // ✅ HANDLE PROFILE SAVE
  const handleSaveProfile = async (e) => {
    e.preventDefault()

    if (!user) return

    setLoading(true)

    const { error } = await supabase
      .from("users")
      .update({
  full_name: name,
  skills: skills,
  profile_completed: true
})
      .eq("id", user.id)

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    alert("Profile saved!")

    // ✅ REDIRECT BASED ON ROLE
   if (!userRole) {
  alert("Role not found")
  setLoading(false)
  return
}

if (userRole === "worker") {
  navigate("/worker-dashboard")
} else if (userRole === "contractor") {
  navigate("/contractor-dashboard")
} else {
  alert("Invalid role")
}
  }

  // ✅ AUTH LOADING
  if (authLoading) {
    return <div className="login-page">Loading...</div>
  }

  return (
  <div className="profile-setup-page">

    <div className="login-card profile-setup-card">



  <div className="setup-icon">
    👋
  </div>

  <h2>Welcome to WorkConnectr</h2>

  <p className="setup-subtext">
    Complete your profile to start applying
    for jobs and connecting with contractors.
  </p>

  <form onSubmit={handleSaveProfile}>

    <div className="input-group">
      <span>👤</span>

      <input
        type="text"
        placeholder="Your full name"
        value={name}
        onChange={(e)=>setName(e.target.value)}
        required
      />
    </div>

    <div className="input-group">
      <span>🛠️</span>

      <input
        type="text"
        placeholder="Skills (e.g Graphic Designer, plumber)"
        value={skills}
        onChange={(e)=>setSkills(e.target.value)}
      />
    </div>

    <div className="skill-suggestions">

  {[
    "Frontend Developer",
    "UI/UX Designer",
    "Electrician",
    "Plumber",
    "Graphic Designer",
    "Video Editor",
    "Mobile App Developer",
    "Carpenter",
    "Painter",
    "Virtual Assistant"
  ].map((skill) => (

    <button
      type="button"
      key={skill}
      className="skill-chip"
      onClick={() => setSkills(skill)}
    >
      {skill}
    </button>

  ))}

</div>

    <button
  type="submit"
  disabled={loading}
  className="profile-submit-btn"
>
      {loading ? "Saving..." : "Continue"}
    </button>

  </form>

</div>

  </div>
)
}

export default ProfileSetup