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
  const [location, setLocation] = useState("")
  const [aboutCompany, setAboutCompany] = useState("")

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

    let updates = {
  profile_completed: true
}

if (userRole === "worker") {
  updates = {
    ...updates,
    full_name: name,
    skills,
    location
  }
}

if (userRole === "contractor") {
  updates = {
    ...updates,
    company_name: name,
    about_company: aboutCompany,
    location
  }
}

const { error } = await supabase
  .from("users")
  .update(updates)
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

window.location.href =
  userRole === "worker"
    ? "/worker-dashboard"
    : "/contractor-dashboard"
  }

  // ✅ AUTH LOADING
  if (authLoading) {
    return <div className="login-page">Loading...</div>
  }

  return (
  <div className="profile-setup-page">

    <div className="profile-setup-card">



  <div className="setup-icon">
    👋
  </div>

  <h2>Welcome to WorkConnectr</h2>

  <p className="setup-subtext">
  {userRole === "contractor"
    ? "Complete your company profile to start hiring workers."
    : "Complete your profile to start applying for jobs and connecting with contractors."
  }
</p>

  <form onSubmit={handleSaveProfile}>

  {/* NAME */}
  <div className="input-group">
    <span>
      {userRole === "contractor" ? "🏢" : "👤"}
    </span>

    <input
      type="text"
      placeholder={
        userRole === "contractor"
          ? "Company name"
          : "Your full name"
      }
      value={name}
      onChange={(e)=>setName(e.target.value)}
      required
    />
  </div>

  {/* WORKER */}
  {userRole === "worker" && (
    <>
      <div className="input-group">
        <span>🛠️</span>

        <input
          type="text"
          placeholder="Skills (e.g Graphic Designer, plumber)"
          value={skills}
          onChange={(e)=>setSkills(e.target.value)}
        />
      </div>

      <div className="input-group">
        <span>📍</span>

        <input
          type="text"
          placeholder="Your location"
          value={location}
          onChange={(e)=>setLocation(e.target.value)}
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
    </>
  )}

  {/* CONTRACTOR */}
  {userRole === "contractor" && (
    <>
      <div className="input-group">
        <span>📝</span>

        <input
          type="text"
          placeholder="About your company"
          value={aboutCompany}
          onChange={(e)=>setAboutCompany(e.target.value)}
        />
      </div>

      <div className="input-group">
        <span>📍</span>

        <input
          type="text"
          placeholder="Company location"
          value={location}
          onChange={(e)=>setLocation(e.target.value)}
        />
      </div>
    </>
  )}

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