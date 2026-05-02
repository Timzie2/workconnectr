import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import WorkerNavbar from "../components/WorkerNavbar"
import { useAuth } from "../context/AuthContext"
import "../styles/jobs.css"
import toast from "react-hot-toast"

function JobsPage() {

  const navigate = useNavigate()

  const { user, loading: authLoading } = useAuth()

  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [tick, setTick] = useState(0)
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)

  // ✅ REDIRECT SAFELY (NO FORCE RELOAD)
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login")
    }
  }, [user, authLoading, navigate])

  // ✅ FETCH DATA AFTER AUTH
  useEffect(() => {
    if (!authLoading && user) {
      fetchAll()
    }
  }, [user, authLoading])

  useEffect(() => {
  const channel = supabase
    .channel("jobs-live")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "jobs"
      },
      () => {
        fetchJobs() // 🔥 refresh jobs automatically
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])

useEffect(() => {
  const interval = setInterval(() => {
    setTick(prev => prev + 1)
  }, 1000)

  return () => clearInterval(interval)
}, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchJobs(), fetchApplications(), fetchRatings()])
    setLoading(false)
  }

  async function fetchRatings() {
  const { data, error } = await supabase
    .from("ratings")
    .select("contractor_id, rating")

  if (error) {
    console.error("Ratings error:", error.message)
    return
  }

  setRatings(data || [])
}

  // ✅ FETCH JOBS
  async function fetchJobs() {
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
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Jobs error:", error.message)
    return
  }

  setJobs(data || [])
}

  // ✅ FETCH APPLICATIONS
  async function fetchApplications() {

    if (!user) return

    const { data, error } = await supabase
      .from("applications")
      .select("job_id, status, created_at")
      .eq("worker_id", user.id)

    if (error) {
      console.error("Applications error:", error.message)
      return
    }

    setApplications(data || [])
  }

  // ✅ APPLY JOB
  async function applyJob(jobId) {

  if (!user) return

  const alreadyApplied = applications.some(a => a.job_id === jobId)
  if (alreadyApplied) return

  const { error } = await supabase
    .from("applications")
    .insert({
      job_id: jobId,
      worker_id: user.id,
      status: "pending"
    })

  if (error) {
    console.error(error)
    toast.error("Failed to apply")
    return
  }

  toast.success("Application sent 🚀")

  // ✅ update applications instead
  setApplications(prev => [
    ...prev,
    { job_id: jobId, status: "pending" }
  ])
}

  const withdrawApplication = async (jobId) => {
  const confirm = window.confirm("Withdraw application?")
  if (!confirm) return

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("job_id", jobId)
    .eq("worker_id", user.id)

  if (error) {
    toast.error("Failed to withdraw")
    return
  }

  toast.success("Application withdrawn")

  // ✅ update applications
  setApplications(prev => prev.filter(a => a.job_id !== jobId))
}

  // ✅ AUTH LOADING
  if (authLoading) {
    return (
      <>
        <WorkerNavbar />
        <div className="worker-dashboard">Loading...</div>
      </>
    )
  }

  // ✅ BLOCK RENDER UNTIL REDIRECT
  if (!user) return null

  // ✅ PAGE LOADING
  if (loading) {
    return (
      <>
        <WorkerNavbar />
        <div className="worker-dashboard">Loading jobs...</div>
      </>
    )
  }

  const sortedJobs = [...jobs].sort((a, b) => {

  // 🔴 CLOSED LAST
  if (a.status === "closed" && b.status !== "closed") return 1
  if (a.status !== "closed" && b.status === "closed") return -1

  // 🚨 URGENT FIRST
  if (a.is_urgent && !b.is_urgent) return -1
  if (!a.is_urgent && b.is_urgent) return 1

  // 💎 FEATURED NEXT
  if (a.is_featured && !b.is_featured) return -1
  if (!a.is_featured && b.is_featured) return 1

  // 🆕 NEWEST LAST
  return new Date(b.created_at) - new Date(a.created_at)
})



const now = new Date()

const activeJobs = sortedJobs.filter(job => {
  const isExpired = job.expires_at
    ? new Date(job.expires_at) < now
    : false

  return job.status !== "closed" && !isExpired
})

const recentlyClosedJobs = sortedJobs.filter(job => {
  const isExpired = job.expires_at
  ? new Date(job.expires_at) < new Date()
  : false

if (job.status !== "closed" && !isExpired) return false
  const now = Date.now()

const closedTime = new Date(
  job.updated_at ?? job.created_at ?? Date.now()
).getTime()

const hours = (now - closedTime) / (1000 * 60 * 60)
  return hours <= 48 // 🔥 last 48 hours
})

const getClosedTimeText = (date) => {
  if (!date) return ""

  const now = Date.now()
  const closed = new Date(date).getTime()

  const diff = now - closed

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 10) return "Closed just now"
if (seconds < 60) return `Closed ${seconds}s ago`
  if (minutes < 60) return `Closed ${minutes} min ago`
  if (hours === 1) return "Closed 1 hour ago"
  if (hours < 24) return `Closed ${hours} hours ago`

  const days = Math.floor(hours / 24)
  return `Closed ${days} day(s) ago`
}

const getAppliedTimeText = (date) => {
  if (!date) return ""

  const now = Date.now()
  const applied = new Date(date).getTime()
  const diff = now - applied

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return "Just applied"
  if (minutes < 60) return `${minutes} min ago`
  if (hours === 1) return "1 hour ago"
  if (hours < 24) return `${hours} hours ago`
  return `${days} day(s) ago`
}

tick

  return (
    <>
      <WorkerNavbar />

      <div className="jobs-page">

        <h1>Available Jobs</h1>

        {jobs.length === 0 && (
          <p style={{ opacity: 0.7 }}>No jobs available yet</p>
        )}

        <div className="jobs-grid">

          {activeJobs.map((job) => {

            const contractorRatings = ratings.filter(
  r => r.contractor_id === job.contractor_id
)

const avgRating =
  contractorRatings.length > 0
    ? (
        contractorRatings.reduce((sum, r) => sum + r.rating, 0) /
        contractorRatings.length
      ).toFixed(1)
    : null

  const application = applications.find(a => a.job_id === job.id)
  const alreadyApplied = !!application
  const status = application?.status
  const appliedTime = application?.created_at

  return (
    <div
      className={`job-card ${job.status === "closed" ? "closed" : ""}`}
      key={job.id}
      onClick={() => navigate(`/job/${job.id}`)}
    >


  <div className="job-badges">

  {job.is_featured && (
    <span className="featured-badge">⭐ Featured</span>
  )}


  {job.is_urgent && (
    <span className="urgent-badge">🚨 Urgent</span>
  )}

</div>

  {/* 🔥 TOP: COMPANY */}
  <div className="company-row">
    <img
      src={
        job.users?.avatar_url
          ? job.users.avatar_url
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
              job.users?.company_name || job.users?.full_name || "User"
            )}&background=0D8ABC&color=fff`
      }
      alt="logo"
      className="company-logo"
      onClick={(e) => {
        e.stopPropagation()
        navigate(`/contractor/${job.contractor_id}`)
      }}
    />

    <div>
      <p className="company-name">
  {job.users?.company_name || job.users?.full_name || "Anonymous"}

  {avgRating && (
    <span className="rating-inline">
      ⭐ {avgRating}
    </span>
  )}
</p>

      {(() => {
  const now = new Date()
  const isExpired = job.expires_at
    ? new Date(job.expires_at) < now
    : false

  if (isExpired) {
    return <span className="closed-badge">⚠️ Expired</span>
  }

  if (job.status === "closed") {
    return <span className="closed-badge">🔒 Closed</span>
  }

  return <span className="hiring-badge">🔥 Hiring Now</span>
})()}

    </div>

    {job.expires_at && new Date(job.expires_at) < new Date() && (
  <p style={{ color: "#f59e0b", fontSize: "12px", marginTop: "4px" }}>
    ⚠️ This job expired
  </p>
)}

  </div>

  {/* 🔥 JOB TITLE */}
  <h3 className="job-title">{job.title}</h3>

  {/* 🔥 DESCRIPTION */}
  <p className="job-desc">
    {job.description?.slice(0, 90)}...
  </p>

  {/* 🔥 INFO ROW */}
  <div className="job-footer">

    <span className="job-location">📍 {job.location}</span>

    <span className="job-salary">
  💰 ₦{Number(job.salary || 0).toLocaleString()}{" "}
  {job.pay_type === "fixed"
    ? "(fixed)"
    : job.pay_type === "daily"
    ? "per day"
    : job.pay_type === "weekly"
    ? "per week"
    : job.pay_type === "monthly"
    ? "per month"
    : ""}
</span>

  </div>

  {/* 🔥 APPLY BUTTON */}
 <div className="job-actions">

  {/* 👁 VIEW BUTTON */}
  <button
    className="view-btn"
    onClick={(e) => {
      e.stopPropagation()
      navigate(`/job/${job.id}`)
    }}
  >
    👁 View
  </button>

  {/* APPLY / WITHDRAW / STATUS */}
  {alreadyApplied ? (
    <button
      className={`apply-btn applied ${status}`}
      onClick={(e) => {
        e.stopPropagation()
        withdrawApplication(job.id)
      }}
    >
      {status === "pending" && "⏳ Pending"}
      {status === "accepted" && "✅ Accepted"}
      {status === "rejected" && "❌ Rejected"}
      {" (Withdraw)"}
    </button>
  ) : (
    <button
      className="apply-btn"
      onClick={(e) => {
        e.stopPropagation()
        applyJob(job.id)
      }}
      disabled={
        job.status === "closed" ||
        (job.expires_at && new Date(job.expires_at) < new Date())
      }
    >
      {job.expires_at && new Date(job.expires_at) < new Date()
        ? "Expired"
        : job.status === "closed"
        ? "Closed"
        : "Apply Now"}
    </button>
  )}

</div>

{alreadyApplied && (
  <small style={{ opacity: 0.7, display: "block", marginTop: "5px" }}>
    Applied {getAppliedTimeText(appliedTime)}
  </small>
)}

</div>

          )
})}

        </div>

        {recentlyClosedJobs.length > 0 && (
  <>
    <h2 style={{ marginTop: "30px", opacity: 0.8 }}>
      Recently Closed Jobs
    </h2>

    <div className="jobs-grid">
      {recentlyClosedJobs.map((job) => (

        <div
  key={job.id}
  className="job-card closed"
>

  {/* 🔴 CLOSED TIME */}
  <div className="closed-overlay">
    🔒 {getClosedTimeText(job.updated_at || job.created_at)}
  </div>

  {/* 🔥 COMPANY (adds structure like active cards) */}
  <div className="company-row">
    <img
      src={
        job.users?.avatar_url
          ? job.users.avatar_url
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
              job.users?.company_name || job.users?.full_name || "User"
            )}&background=0D8ABC&color=fff`
      }
      alt="logo"
      className="company-logo"
    />

    <div>
      <p className="company-name">
        {job.users?.company_name || job.users?.full_name || "Anonymous"}
      </p>
      <span className="closed-badge">🔒 Closed</span>
    </div>
  </div>

  {/* 🔥 TITLE */}
  <h3 className="job-title">{job.title}</h3>

  {/* 🔥 DESCRIPTION */}
  <p className="job-desc">
    {job.description?.slice(0, 90)}...
  </p>

  {/* 🔥 FOOTER */}
  <div className="job-footer">
    <span>📍 {job.location}</span>
    <span>
      💰 ₦{Number(job.salary || 0).toLocaleString()}
    </span>
  </div>

</div>

      ))}
    </div>
  </>
)}

      </div>
    </>
  )
}

export default JobsPage