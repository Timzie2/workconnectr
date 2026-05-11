import { useSaved } from "../context/SavedContext"
import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import supabase from "../supabaseClient"
import WorkerNavbar from "../components/WorkerNavbar"
import { useAuth } from "../context/AuthContext" // ✅ NEW
import "../styles/WorkerDashboard.css"
import toast from "react-hot-toast"

function JobDetails() {

  const { id } = useParams()
  const navigate = useNavigate()

  const { user, loading: authLoading } = useAuth() // ✅ GLOBAL AUTH

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)

  const [applying, setApplying] = useState(false)
  const [application, setApplication] = useState(null)
  const [tick, setTick] = useState(0)

  const { savedJobs, toggleSave } = useSaved()
  const saved = savedJobs.includes(Number(id))

  // ✅ LOAD DATA AFTER AUTH
  useEffect(() => {
    if (!authLoading && user) {
      loadData()
    }
  }, [user, authLoading])

  async function loadData() {
    await Promise.all([
      fetchJob(),
      checkIfApplied()
    ])
    setLoading(false)
  }

  useEffect(() => {
  const interval = setInterval(() => {
    setTick(Date.now())
  }, 1000)

  return () => clearInterval(interval)
}, [])

  // ✅ FETCH JOB
  async function fetchJob() {
    const { data, error } = await supabase
      .from("jobs")
      .select(`
  *,
  users!jobs_contractor_id_fkey (
    id,
    full_name,
    company_name,
    avatar_url
  )
`)
      .eq("id", id)
      .single()

    if (!error && data) {
  const safeUser = data.users || {
    full_name: "Anonymous",
    company_name: null,
    avatar_url: null
  }

  setJob({ ...data, users: safeUser })
}
    else console.error(error.message)
  }

  // ✅ CHECK APPLICATION (NO AUTH CALL 🔥)
  async function checkIfApplied() {
  if (!user) return

  const { data } = await supabase
    .from("applications")
    .select("id, status, created_at")
    .eq("job_id", id)
    .eq("worker_id", user.id)
    .maybeSingle()

  if (data) {
    setApplication(data)
  }
}

  // ✅ APPLY / UNAPPLY (NO AUTH CALL 🔥)
  async function applyJob() {
  if (!user) return

  const isExpired =
    job.expires_at &&
    new Date(job.expires_at) < new Date()

  // 🔒 BLOCK CLOSED / EXPIRED
  if (job.status === "closed" || isExpired) {
    toast.error("This job is no longer available")
    return
  }

  // 🔁 WITHDRAW APPLICATION
  if (application) {
    const confirm = window.confirm("Withdraw application?")
    if (!confirm) return

    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("job_id", job.id)
      .eq("worker_id", user.id)

    if (error) {
      toast.error("Failed to withdraw")
      return
    }

    // 🔔 notify contractor
    supabase.from("notifications").insert({
      user_id: job.contractor_id,
      type: "withdraw",
      message: `${user.email} withdrew application for ${job.title}`,
      created_at: new Date().toISOString()
    })

    setApplication(null)
    toast.success("Application withdrawn ❌")
    return
  }

  // 🟢 APPLY
  setApplying(true)

  const { error } = await supabase
    .from("applications")
    .insert({
      job_id: job.id,
      worker_id: user.id,
      status: "pending"
    })

  if (error) {
    toast.error("Something went wrong")
  } else {
    // ✅ update UI instantly
    setApplication({
      status: "pending",
      created_at: new Date().toISOString()
    })

    // 🔔 notify user (optional)
    supabase.from("notifications").insert({
      user_id: user.id,
      type: "application",
      message: `You applied for ${job.title}`,
      created_at: new Date().toISOString()
    })

    toast.success("Application sent 🚀")
  }

  setApplying(false)
}

  const getUrgencyText = (date) => {
  if (!date) return ""

  const now = new Date()
  const expiry = new Date(date)

  let diff = expiry.getTime() - now.getTime()

  if (diff <= 0) return "Expired"

  const totalSeconds = Math.floor(diff / 1000)

  const days = Math.floor(totalSeconds / (60 * 60 * 24))
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60))
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`

  return `${seconds}s left`
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

const getTimeRemainingText = (date) => {
  if (!date) return ""

  const now = new Date()
  const expiry = new Date(date)

  const diff = expiry - now

  if (diff <= 0) return "Expired"

  const totalSeconds = Math.floor(diff / 1000)

  const days = Math.floor(totalSeconds / (60 * 60 * 24))
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60))
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)

  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h ${minutes}m left`
  return `${minutes}m left`
}

  // ✅ HANDLE AUTH LOADING
  if (authLoading) return <div className="worker-dashboard">Loading...</div>

  if (!user) {
    navigate("/login")
    return null
  }

  // ✅ PAGE LOADING
  if (loading) return <div className="worker-dashboard">Loading...</div>
  if (!job) return <div className="worker-dashboard">Job not found</div>

  const now = new Date()

  const isExpired =
  job.expires_at &&
  new Date(job.expires_at) < new Date()

const alreadyApplied = !!application
const status = application?.status
const appliedTime = application?.created_at

const isUrgentActive =
  job?.is_urgent &&
  job?.urgent_expires_at &&
  new Date(job.urgent_expires_at) > now

  const isFeaturedActive =
  job?.featured_until &&
  new Date(job.featured_until) > new Date()

  return (
    <>
      <WorkerNavbar />

      <div className="worker-dashboard">

        <div className="job-header">
          <button 
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
        </div>

        <div className="job-details-card">

          <div className="job-header-top">

  {/* LEFT: COMPANY */}
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

    <p
      className="company-name"
      onClick={() => navigate(`/contractor/${job.contractor_id}`)}
      style={{ cursor: "pointer" }}
    >
      {job.users?.company_name || job.users?.full_name || "Anonymous"}
    </p>
  </div>

  {/* RIGHT: BADGES */}
  <div className="job-badges-right">

    {isFeaturedActive && (
      <div className="featured-box">
        <span>💎 Featured</span>
        <small>⏳ {getTimeRemainingText(job.featured_until)}</small>
      </div>
    )}

    {isUrgentActive && (
  <div className="urgent-pill">
    <span>🔥 URGENT</span>
    {job.urgent_expires_at && (
      <small>⏳ {getUrgencyText(job.urgent_expires_at)}</small>
    )}
  </div>
)}

  </div>

</div>    

<h1 className="job-title">{job.title}</h1>

{isExpired && (
  <div className="expired-banner">
    ⚠️ This job has expired
  </div>
)}


          <p className="job-description">{job.description}</p>

          <div className="job-info">
            <p>📍 {job.location}</p>
            <div className="job-meta-row">
  <span className="salary-badge">
    ₦{job.salary?.toLocaleString() || "N/A"}{" "}
    {job.pay_type
      ? job.pay_type === "fixed"
        ? "(fixed)"
        : `/ ${job.pay_type.replace("ly", "")}`
      : ""}
  </span>
</div>
            <p>📅 {new Date(job.created_at).toDateString()}</p>
          </div>

          <div className="job-actions">

            <button
  className={`apply-btn 
    ${alreadyApplied ? "applied" : ""} 
    ${status || ""}`}
  onClick={applyJob}
  disabled={
    applying ||
    job.status === "closed" ||
    (job.expires_at && new Date(job.expires_at) < new Date())
  }
>
              {applying
  ? "Processing..."
  : alreadyApplied
  ? status === "pending"
    ? "⏳ Pending (Withdraw)"
    : status === "approved"
    ? "✅ Approved (Withdraw)"
    : "❌ Rejected (Withdraw)"
  : isExpired
  ? "Expired"
  : job.status === "closed"
  ? "Closed"
  : "Apply Now"}
            </button>

            {alreadyApplied && (
  <small style={{ opacity: 0.7, marginTop: "6px", display: "block" }}>
    Applied {getAppliedTimeText(appliedTime)}
  </small>
)}

            <button
              className={`save-btn ${saved ? "saved" : ""}`}
              onClick={() => toggleSave(job.id)}
            >
              {saved ? "Saved ✓" : "Save Job"}
            </button>

          </div>

        </div>

      </div>
    </>
  )
}

export default JobDetails