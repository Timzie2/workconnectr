import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import WorkerNavbar from "../components/WorkerNavbar"
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
      <WorkerNavbar />

      <div className="worker-dashboard">

        <h1 className="dashboard-title">Saved Jobs ⭐</h1>

        <div className="search-bar">

  <input
    type="text"
    placeholder="Search saved jobs..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="search-input"
  />

</div>

<div className="stats-grid">

  <div className="stat-card">
    <h4>Total Saved</h4>
    <p>{jobs.length}</p>
  </div>

  <div className="stat-card">
    <h4>Showing</h4>
    <p>{filteredJobs.length}</p>
  </div>

</div>

        {filteredJobs.length === 0 && (
  <div className="empty-state">

    <div className="empty-icon">
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
      className="browse-btn"
      onClick={() => navigate("/jobs")}
    >
      Browse Jobs
    </button>

  </div>
)}

        <div className="worker-jobs-grid">

          {filteredJobs.map((job) => (

  <div className="application-card" key={job.id}>

    {/* COMPANY */}
    <div className="company-row saved-company-row">

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
        className="company-logo"
        onClick={() => navigate(`/contractor/${job.contractor_id}`)}
      />

      <div>

        <p
  className="company-name"
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
    <div className="status-badge pending">
      🏷 {job.category || "General"}
    </div>

    {/* TITLE */}
    <h3 className="job-title">
      {job.title}
    </h3>

    {/* DESCRIPTION */}
    <p className="job-desc">
      {job.description?.slice(0, 100)}...
    </p>

    {/* INFO */}
    <div className="app-info">

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
    <div className="app-actions">

      <button
        className="view-btn"
        onClick={() => navigate(`/job/${job.id}`)}
      >
        View Job
      </button>

      <button
        className="withdraw-btn"
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