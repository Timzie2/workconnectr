import { useState, useEffect } from "react"
import supabase from "../supabaseClient"
import AppNavbar from "../components/AppNavbar"
import { useAuth } from "../context/AuthContext" // ✅ IMPORTANT
import "../styles/ContractorProfile.css"

function ContractorProfile() {

  const { user, loading } = useAuth() // ✅ GLOBAL AUTH

  const [company, setCompany] = useState("")
  const [location, setLocation] = useState("")
  const [about, setAbout] = useState("")
  const [logo, setLogo] = useState("")

  const [jobsPosted, setJobsPosted] = useState(0)
  const [activeJobs, setActiveJobs] = useState(0)
  const [applications, setApplications] = useState(0)
  const [fullName, setFullName] = useState("")
  const [previewLogo, setPreviewLogo] = useState("")
  const [showLogoModal, setShowLogoModal] = useState(false)

  useEffect(() => {

    if (!user) return

    const loadData = async () => {

      const userId = user.id

      // ✅ PROFILE
      const { data: profile, error } = await supabase
  .from("users")
  .select("full_name, company_name, location, about_company, avatar_url")
  .eq("id", userId)
  .single()

if (error) {
  console.log("PROFILE ERROR:", error.message)
}

      if (profile) {
        setCompany(profile.company_name || "")
        setLocation(profile.location || "")
        setAbout(profile.about_company || "")
        setLogo(profile.avatar_url || "")
        setFullName(profile.full_name || "")
      }

      // ✅ TOTAL JOBS
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id")
        .eq("contractor_id", userId)

      setJobsPosted(jobs?.length || 0)

      // ✅ ACTIVE JOBS
      const { data: active } = await supabase
        .from("jobs")
        .select("id")
        .eq("contractor_id", userId)
        .eq("status", "open")

      setActiveJobs(active?.length || 0)

      // ✅ APPLICATIONS
      const { data: apps } = await supabase
        .from("applications")
        .select("id, jobs!inner(contractor_id)")
        .eq("jobs.contractor_id", userId)

      setApplications(apps?.length || 0)
    }

    loadData()

  }, [user])

  // ✅ LOGO UPLOAD
  const uploadLogo = async (e) => {

    const file = e.target.files[0]

    if(file){

  const localPreview = URL.createObjectURL(file)

  setPreviewLogo(localPreview)

  setLogo(localPreview)
}

    if (!file || !user) return

    const fileName = `${user.id}-${Date.now()}`

    const { error } = await supabase.storage
      .from("company-logos")
      .upload(fileName, file, { upsert: true })

    if (error) {
      alert("Upload failed")
      return
    }

    const { data } = supabase.storage
      .from("company-logos")
      .getPublicUrl(fileName)

    setLogo(data.publicUrl)
  }

  // ✅ SAVE PROFILE
  const saveProfile = async () => {

    if (!user) {
      alert("Not logged in")
      return
    }

    const { error } = await supabase
      .from("users")
      .update({
  full_name: fullName,
  company_name: company,
  location,
  about_company: about,
  avatar_url: logo
})
      .eq("id", user.id)

    if (error) {
      alert("Failed to save")
      return
    }

    alert("Profile saved ✅")
  }

  // ✅ WAIT FOR AUTH
  if (loading) return null

  if (!user) {
    window.location.href = "/login"
    return null
  }

  const fields = {
  company,
  location,
  about,
  logo
}

const filledCount = Object.values(fields).filter(Boolean).length
const totalFields = Object.keys(fields).length
const progress = Math.round((filledCount / totalFields) * 100)

const missingFields = Object.entries(fields)
  .filter(([_, value]) => !value)
  .map(([key]) => {
  if (key === "company") return "company name"
  if (key === "about") return "description"
  if (key === "logo") return "logo"
  return key
})

  return (

    <div>
      <AppNavbar />

      <div className="profile-page">
        <div className="profile-card">

          {/* HEADER */}
          <div className="profile-header">

            <div className="company-avatar">
              {logo ? <img
  src={logo}
  alt="logo"
  onClick={() => setShowLogoModal(true)}
/> : "🏢"}
            </div>

            <div>
              <h1>{fullName || company || "Your Company"}</h1>
              <p className="location-text">
  📍 {location || "Add location"}
</p>
            </div>

          </div>

          {showLogoModal && (

  <div
    className="contractor-logo-modal"
    onClick={() => setShowLogoModal(false)}
  >

    <button
      className="contractor-logo-close"
      onClick={() => setShowLogoModal(false)}
    >
      ×
    </button>

    <img
      src={logo}
      alt="preview"
      className="contractor-logo-preview"
      onClick={(e) => e.stopPropagation()}
    />

  </div>

)}

          {/* STATS */}
          <div className="profile-stats">
            <div className="stat-box">
              <h3>{jobsPosted}</h3>
              <p>Jobs Posted</p>
            </div>

            <div className="stat-box">
              <h3>{activeJobs}</h3>
              <p>Active Jobs</p>
            </div>

            <div className="stat-box">
              <h3>{applications}</h3>
              <p>Applications</p>
            </div>
          </div>

          <div className="contractor-progress-section">

  <div className="progress-top">
    <span>Profile completion</span>
    <span>{progress}%</span>
  </div>

  <div className="progress-bar">
    <div
      className="progress-fill"
      style={{ width: `${progress}%` }}
    />
  </div>

  {progress < 100 && (
    <p className="progress-warning">
  {missingFields.length === 1
    ? `Complete your ${missingFields[0]}`
    : `Complete your ${missingFields.slice(0, 2).join(" & ")}`
  }
</p>
  )}

</div>

          {/* 🔥 MODERN FORM */}

<div className="form-section">

  {/* LOGO */}
  <div className="logo-upload">
    <label>Company Logo</label>

    <div className="logo-box">
      {logo ? (
        <img src={logo} className="logo-preview" />
      ) : (
        <span>Upload</span>
      )}
    </div>

    <input type="file" onChange={uploadLogo} />
  </div>

  <div className="form-group">
  <label>Full Name</label>
  <input
    value={fullName}
    placeholder="Enter your name"
    onChange={(e)=>setFullName(e.target.value)}
  />
</div>

  {/* COMPANY NAME */}
  <div className="form-group">
    <label>Company Name</label>
    <input
      value={company}
      placeholder="Enter company name"
      onChange={(e)=>setCompany(e.target.value)}
    />
  </div>

  {/* LOCATION */}
  <div className="form-group">
    <label>Location</label>
    <input
      value={location}
      placeholder="e.g Lagos, Nigeria"
      onChange={(e)=>setLocation(e.target.value)}
    />
  </div>

  {/* ABOUT */}
  <div className="form-group">
    <label>About Company</label>
    <textarea
      value={about}
      placeholder="Tell us about your company..."
      onChange={(e)=>setAbout(e.target.value)}
    />
  </div>

  <button className="save-btn" onClick={saveProfile}>
    Save Profile
  </button>

</div>

        </div>
      </div>

    </div>
  )
}

export default ContractorProfile