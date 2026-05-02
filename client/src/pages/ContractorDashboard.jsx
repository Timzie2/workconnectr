import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"

import ContractorNavbar from "../components/ContractorNavbar"
import "../styles/ContractorDashboard.css"
import BoostModal from "../components/BoostModal"
import "../styles/layout.css"
import "../styles/components.css"
import "../styles/dashboard.css"

function ContractorDashboard() {

  const navigate = useNavigate()

  const [jobs, setJobs] = useState([])
  const [applicationsCount, setApplicationsCount] = useState(0)
  const [user, setUser] = useState(null)

  const [selectedJob, setSelectedJob] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [tick, setTick] = useState(0)
  const [activeJobs, setActiveJobs] = useState([])
  const [archivedJobs, setArchivedJobs] = useState([])
  const [view, setView] = useState("active")
  

  useEffect(() => {
  const interval = setInterval(() => {
    setTick(prev => prev + 1)
  }, 1000) // every 1 second

  return () => clearInterval(interval)
}, [])

  useEffect(() => {
  getUserAndJobs()

  return () => {
    setJobs([]) // 🔥 prevent stale state when leaving page
  }
}, [])

  // 🔥 REALTIME UPDATE (FIX YOUR ISSUE HERE)
  useEffect(() => {

    const channel = supabase
      .channel("jobs-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs"
        },
        (payload) => {

          setJobs(prev =>
            prev.map(job =>
              job.id === payload.new.id
                ? {
                    ...job,
                    ...payload.new,
                    is_featured:
  payload.new.featured_until &&
  new Date(payload.new.featured_until) > new Date()
                  }
                : job
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }

  }, [])

  const getDaysRemaining = (date) => {
  if (!date) return null

  const now = new Date()
  const expiry = new Date(date)

  const diff = expiry.getTime() - now.getTime()

  if (diff <= 0) return 0

  // 🔥 FINAL CORRECT LOGIC
  const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1

  return days
}

const getUrgencyText = (date) => {
  if (!date) return ""

  const now = new Date()
  const expiry = new Date(date)

  const diff = expiry.getTime() - now.getTime()

  if (diff <= 0) return "Expired"

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days >= 2) return `${days} days left`
  if (days === 1) return "1 day left"
  if (hours >= 1) return `${hours}h left`

  return "Ending soon"
}

  const getUserAndJobs = async () => {

    setJobs([])
    const { data } = await supabase.auth.getSession()

if (!data.session) {
  navigate("/login")
  return
}

const user = data.session.user

    setUser(user)

    const { data: jobsData, error } = await supabase
      .from("jobs")
      .select(`
  *,
  users:contractor_id (
    company_name,
    avatar_url
  )
`)
      .eq("contractor_id", user.id)

    if (error) {
      console.log("Jobs error:", error.message)
      return
    }
    await fixExpiredJobs(jobsData)
await fixExpiredUrgentJobs(jobsData)

    const now = new Date()

const updatedJobs = jobsData.map(job => {
  if (
    job.urgent_expires_at &&
    new Date(job.urgent_expires_at) <= now
  ) {
    return { ...job, is_urgent: false }
  }
  return job
})

    const processedJobs = (updatedJobs || []).map(job => {
      const isActive =
  job.featured_until &&
  new Date(job.featured_until) > now

      return {
        ...job,
        is_featured: isActive
      }
    })

   const sortedJobs = processedJobs.sort((a, b) => {

  // 🔥 URGENT FIRST
  if (a.is_urgent && !b.is_urgent) return -1
  if (!a.is_urgent && b.is_urgent) return 1

  // 🔥 THEN FEATURED
  if (a.is_featured && !b.is_featured) return -1
  if (!a.is_featured && b.is_featured) return 1

  // 🔥 THEN NEWEST
  return new Date(b.created_at) - new Date(a.created_at)
})

    const active = sortedJobs.filter(j => j.status !== "archived")
const archived = sortedJobs.filter(j => j.status === "archived")

setActiveJobs(active)
setArchivedJobs(archived)
setJobs(sortedJobs) // optional (for stats)
    fetchApplications(sortedJobs)
  }

  const fetchApplications = async (jobsData) => {

    if (!jobsData || jobsData.length === 0) {
      setApplicationsCount(0)
      return
    }

    const jobIds = jobsData.map(job => job.id)

    const { data } = await supabase
  .from("applications")
  .select("id") // ✅ LIGHTER & FASTER
  .in("job_id", jobIds)

    if (data) {
      setApplicationsCount(data.length)
    }
  }

  const deleteJob = async (id) => {

  const confirmDelete = window.confirm("Delete this job?")
  if (!confirmDelete) return

  const { data, error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", id)
    .select()

  if (error) {
    console.log("Delete error:", error.message)
    alert("Failed to delete job")
    return
  }

  setJobs(prev => prev.filter(job => job.id !== id))
}


// ✅ MOVE IT HERE (OUTSIDE)
const toggleJobStatus = async (job) => {
  const now = new Date()

  const isExpired =
    job.expires_at
      ? new Date(job.expires_at) < now
      : false

  let newStatus = job.status === "open" ? "closed" : "open"

  let updateData = { status: newStatus }

  if (newStatus === "open" || isExpired) {
    updateData.expires_at = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString()
  }

  const { error } = await supabase
    .from("jobs")
    .update(updateData)
    .eq("id", job.id)

  if (error) {
    console.log("UPDATE ERROR:", error)
    alert("Failed to update status")
    return
  }

  // ✅ UPDATE ALL STATES
  const updatedList = jobs.map(j =>
    j.id === job.id ? { ...j, ...updateData } : j
  )

  setJobs(updatedList)
  setActiveJobs(updatedList.filter(j => j.status !== "archived"))
  setArchivedJobs(updatedList.filter(j => j.status === "archived"))
}

const fixExpiredJobs = async (jobs) => {

  const now = new Date()

  const expiredJobs = jobs.filter(job =>
    job.featured_until &&
new Date(job.featured_until) <= now
  )

  if (expiredJobs.length === 0) return

  const ids = expiredJobs.map(j => j.id)

  const { error } = await supabase
    .from("jobs")
    .update({ is_featured: false })
    .in("id", ids)

  if (error) {
    console.log("Expire fix error:", error.message)
  }
}

 const fixExpiredUrgentJobs = async (jobs) => {
  const now = new Date()

  const expired = jobs.filter(job =>
    job.urgent_expires_at &&
    new Date(job.urgent_expires_at) <= now
  )

  if (expired.length === 0) return

  const ids = expired.map(j => j.id)

  await supabase
    .from("jobs")
    .update({ is_urgent: false })
    .in("id", ids)
}

  return (
    <>
      <ContractorNavbar />

      <div className="dashboard-container">

        <h1 className="dashboard-title">Contractor Dashboard</h1>

        <div className="dashboard-actions">

          <button
            className="primary-btn"
            onClick={() => navigate("/post-job")}
          >
            Post New Job
          </button>

          <button
            className="secondary-btn"
            onClick={() => navigate("/payments")}
          >
            💰 Payment History
          </button>

        </div>

        <div className="stats-container">

          <div className="stat-card">
            <p className="stat-title">Total Jobs</p>
            <h2 className="stat-number">{jobs.length}</h2>
          </div>

          <div className="stat-card">
            <p className="stat-title">Applications</p>
            <h2 className="stat-number">{applicationsCount}</h2>
          </div>

          <div className="stat-card">
            <p className="stat-title">Featured Jobs</p>
            <h2 className="stat-number">
              {jobs.filter(j => j.is_featured).length}
            </h2>
          </div>

        </div>

        <h2 className="jobs-title">Your Job Posts</h2>

        <div style={{ marginBottom: "20px" }}>
  <button
    className={view === "active" ? "primary-btn" : "secondary-btn"}
    onClick={() => setView("active")}
  >
    Active Jobs
  </button>

  <button
    className={view === "archived" ? "primary-btn" : "secondary-btn"}
    onClick={() => setView("archived")}
    style={{ marginLeft: "10px" }}
  >
    Archived Jobs
  </button>
</div>

        {jobs.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No jobs posted yet</p>
        ) : (

          <div className="jobs-grid">

            {(view === "active" ? activeJobs : archivedJobs).map((job) => {

              tick

              const now = new Date()

              const isExpired = job.expires_at
  ? new Date(job.expires_at) < now
  : false

  const timeLeft =
  job.expires_at
    ? new Date(job.expires_at) - now
    : 0

const isExpiringSoon =
  timeLeft > 0 &&
  timeLeft < 24 * 60 * 60 * 1000 // less than 24 hours

  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60))

const isUrgentActive =
  job.is_urgent &&
  job.urgent_expires_at &&
  new Date(job.urgent_expires_at) > now

              const daysLeft = getDaysRemaining(job.featured_until)

              return (
                <div key={job.id} className="job-card">

                  <div className="job-badges">

  {isUrgentActive && (
    <span className="urgent-badge">🚨 Urgent</span>
  )}

  {job.is_featured && (
    <span
      className={`featured-tag ${
        daysLeft <= 0
          ? "expired"
          : daysLeft <= 1
          ? "urgent"
          : "active"
      }`}
    >
      💎 {
        daysLeft > 0
          ? daysLeft <= 1
            ? `Expiring Soon (${daysLeft}d)`
            : `Featured (${daysLeft}d left)`
          : "Expired"
      }
    </span>
  )}

</div>

{isUrgentActive && job.urgent_expires_at && (() => {
  const text = getUrgencyText(job.urgent_expires_at)

  let className = "urgent-timer"

  if (text.includes("h") || text === "Ending soon") {
    className += " danger"
  } else if (text.includes("1 day")) {
    className += " warning"
  }

  return (
    <small className={className}>
      ⏳ {text}
    </small>
  )
})()}

                  <div
  className="job-company"
  onClick={() => {
  if (user.id === job.contractor_id) {
    navigate("/contractor-profile")
  } else {
    navigate(`/contractor/${job.contractor_id}`)
  }
}}
  style={{ cursor: "pointer" }}
>

  {job.users?.avatar_url && (
    <img
      src={job.users.avatar_url}
      alt="logo"
      className="job-logo"
    />
  )}

  <span className="company-name">
  {job.users?.company_name || "Your Company"}
</span>
</div>

<div className="status-badge">
  {isExpired
    ? "⚠️ Expired"
    : job.status === "open"
    ? "🟢 Open"
    : job.status === "closed"
    ? "🔴 Closed"
    : "📦 Archived"}
</div>

{isExpired && (
  <p style={{ color: "#f59e0b", fontSize: "13px", marginTop: "5px" }}>
    ⚠️ This job expired — reopen to continue hiring
  </p>
)}

{isExpiringSoon && !isExpired && (
  <p style={{ color: "#facc15", fontSize: "13px", marginTop: "5px" }}>
    ⏳ {hoursLeft}h left
  </p>
)}

                  <h3 className="job-title">{job.title}</h3>

                  <p className="job-desc">{job.description}</p>

                  <div className="job-info">
                    <span>📍 {job.location}</span>
                    <span>💰 ₦{job.salary || job.daily_pay || "N/A"}</span>
                  </div>

                  <div className="job-tags">
                    <span className="tag">{job.category || "General"}</span>
                  </div>

                  <div className="job-actions">

  <div className="job-actions-left">

    <button
  className="edit-btn"
  disabled={isExpired}
  onClick={() => {
    if (isExpired) return
    navigate(`/contractor/edit-job/${job.id}`)
  }}
>
  {isExpired ? "Expired" : "Edit"}
</button>

    <button
      className="delete-btn"
      onClick={() => deleteJob(job.id)}
    >
      Delete
    </button>

    <button
  className="applicants-btn"
  onClick={() =>
    navigate(`/contractor-applications/${job.id}`, {
      state: { from: "dashboard" }
    })
  }
>
  Applicants
</button>

<button
  className="status-btn"
  onClick={() => toggleJobStatus(job)}
>
  {isExpired
  ? "🔁 Reopen Job"
  : job.status === "open"
  ? "Close Job"
  : job.status === "closed"
  ? "Reopen"
  : "Archived"}
</button>

{job.status !== "archived" && (
  <button
    className="archive-btn"
    onClick={async () => {
      const confirm = window.confirm("Archive this job?")
      if (!confirm) return

      const { error } = await supabase
        .from("jobs")
        .update({ status: "archived" })
        .eq("id", job.id)

      if (!error) {
        getUserAndJobs()
      }
    }}
  >
    📦 Archive
  </button>
)}

  </div>

  <div className="job-actions-right">

    {job.status === "archived" && (
  <button
    className="boost-btn"
    onClick={async () => {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "open" })
        .eq("id", job.id)

      if (!error) {
        alert("Job reposted!")
        getUserAndJobs()
      }
    }}
  >
    🔁 Repost
  </button>
)}

    {job.is_featured && daysLeft > 0 ? (
  <button className="boosted-btn">
    🚀 Boosted
  </button>
) : job.status === "open" && !isExpired ? (
  <button
    className="boost-btn"
    onClick={() => {
      setSelectedJob(job)
      setSelectedPlan(null)
    }}
  >
    {daysLeft <= 0 ? "🔁 Boost Again" : "💎 Boost Job"}
  </button>
) : null}

  </div>

</div>

                </div>
              )
            })}

          </div>

        )}

      </div>

      {/* 🔥 MODAL */}
      {selectedJob && (
  <BoostModal
    job={selectedJob}
    selectedPlan={selectedPlan}
    setSelectedPlan={setSelectedPlan}
    user={user}

    onClose={() => {
      setSelectedJob(null)
      setSelectedPlan(null)
    }}

    
  />
)}

    </>
  )
}

export default ContractorDashboard