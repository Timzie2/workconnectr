import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import AppNavbar from "../components/AppNavbar"
import { useSaved } from "../context/SavedContext"
import "../styles/SavedJobs.css"

function SavedJobs() {

  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [search, setSearch] = useState("")

  // ✅ GLOBAL STATE
  const { savedJobs, toggleSave } = useSaved()

  const filteredJobs = jobs.filter(job =>
  job.title?.toLowerCase().includes(search.toLowerCase())
)

  // ✅ FETCH JOBS BASED ON GLOBAL SAVED IDS
  useEffect(() => {
    fetchJobs()
  }, [savedJobs])

  async function fetchJobs() {

    if (savedJobs.length === 0) {
      setJobs([])
      return
    }

    const { data, error } = await supabase
      .from("jobs")
      .select(`
  *,
  users!jobs_contractor_id_fkey (
    full_name,
    company_name,
    avatar_url
  )
`)
      .in("id", savedJobs)

    if (error) {
      console.error("Jobs fetch error:", error.message)
    } else {
      setJobs(data || [])
    }
  }

  return (
    <>
      <AppNavbar />

      <div className="saved-jobs-page">

        <h1 className="saved-jobs-title">Saved Jobs ⭐</h1>

        <div className="saved-jobs-search-bar">

  <input
    type="text"
    placeholder="Search saved jobs..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="saved-search-input"
  />

</div>

<div className="saved-stats-grid">

  <div className="saved-stat-card">
    <h4>Total Saved</h4>
    <p>{jobs.length}</p>
  </div>

  <div className="saved-stat-card">
    <h4>Showing</h4>
    <p>{filteredJobs.length}</p>
  </div>

</div>

        {filteredJobs.length === 0 && (
  <div className="saved-empty-state">

    <div className="saved-empty-icon">
      ⭐
    </div>

    <h3>
      {search
        ? "No matching saved jobs"
        : "No saved jobs yet"}
    </h3>

    <p>
      {search
        ? "Try another keyword."
        : "Save jobs to view them later."}
    </p>

    <button
      className="saved-browse-btn"
      onClick={() => navigate("/jobs")}
    >
      Browse Jobs
    </button>

  </div>
)}

        <div className="saved-jobs-grid">

          {filteredJobs.map((job) => (

  <div className="saved-job-card" key={job.id}>

    {/* COMPANY */}
    <div className="saved-job-company-row">

      <img
        src={
          job.users?.avatar_url
            ? job.users.avatar_url
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                job.users?.company_name ||
                job.users?.full_name ||
                "User"
              )}&background=0D8ABC&color=fff`
        }
        alt="logo"
        className="saved-company-logo"
        onClick={() => navigate(`/contractor/${job.contractor_id}`)}
      />

      <div>

        <p
  className="saved-company-name"
  onClick={() => navigate(`/contractor/${job.contractor_id}`)}
  style={{ cursor: "pointer" }}
>
  {job.users?.company_name ||
    job.users?.full_name ||
    "Anonymous"}
</p>
      </div>

    </div>

    {/* CATEGORY */}
    <div className="saved-status-badge saved-pending">
      🏷 {job.category || "General"}
    </div>

    {/* TITLE */}
    <h3 className="saved-job-title">
      {job.title}
    </h3>

    {/* DESCRIPTION */}
    <p className="saved-job-desc">
      {job.description?.slice(0, 100)}...
    </p>

    {/* INFO */}
    <div className="saved-job-info">

      <span>
        📍 {job.location}
      </span>

      <span className="salary">
  💰 ₦{Number(job.salary || 0).toLocaleString()}{" "}

  {job.pay_type === "fixed"
    ? "(fixed)"
    : job.pay_type === "daily"
    ? "per day"
    : job.pay_type === "weekly"
    ? "per week"
    : job.pay_type === "monthly"
    ? "per month"
    : "per job"}
</span>

    </div>

    {/* ACTIONS */}
    <div className="saved-job-actions">

      <button
        className="saved-view-btn"
        onClick={() => navigate(`/job/${job.id}`)}
      >
        View Job
      </button>

      <button
        className="saved-remove-btn"
        onClick={() => toggleSave(job.id)}
      >
        Remove
      </button>

    </div>

  </div>

))}

        </div>

      </div>
    </>
  )
}

export default SavedJobs