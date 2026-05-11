import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import WorkerNavbar from "../components/WorkerNavbar"
import { useAuth } from "../context/AuthContext"
import "../styles/WorkerApplications.css"

function WorkerApplications(){

  const navigate = useNavigate()

  const { user, loading: authLoading } = useAuth()

const [applications,setApplications] = useState([])
const [activeTab, setActiveTab] = useState("all")
const [search, setSearch] = useState("")
const [loading, setLoading] = useState(true)
const [showRatingModal, setShowRatingModal] = useState(false)

const [selectedApplication, setSelectedApplication] = useState(null)

const [rating, setRating] = useState(5)

const [comment, setComment] = useState("")

const getAppliedTime = (date) => {

  if (!date) return ""

  const now = Date.now()
  const applied = new Date(date).getTime()

  const diff = now - applied

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return "Just applied"
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours} hour(s) ago`

  return `${days} day(s) ago`
}

  // ✅ SAFE REDIRECT
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login")
    }
  }, [user, authLoading, navigate])

  // ✅ LOAD AFTER AUTH
  useEffect(()=>{
    if (!authLoading && user) {
      fetchApplications()
    }
  },[user, authLoading])

  // ✅ FETCH APPLICATIONS
  async function fetchApplications(){

    if (!user) return

    setLoading(true)

    const { data,error } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        job_id,
        created_at,
        jobs (
  id,
  title,
  location,
  salary,
  contractor_id,
  users!jobs_contractor_id_fkey (
    full_name,
    company_name,
    avatar_url
  )
)
      `)
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false })

    if(error){
      console.error("Applications error:", error.message)
    } else {
      setApplications(data || [])
    }

    setLoading(false)
  }

  // ✅ WITHDRAW APPLICATION
  async function withdraw(jobId){

    if (!user) return

    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("worker_id", user.id)
      .eq("job_id", jobId)

    if(error){
      console.error("Withdraw error:", error.message)
      return
    }

    // ✅ INSTANT UI UPDATE
    setApplications(prev =>
      prev.filter(app => app.job_id !== jobId)
    )
  }

  function openRatingModal(application){

  setSelectedApplication(application)

  setShowRatingModal(true)
}

async function submitRating(){

  if(!selectedApplication) return

  const { error } = await supabase
    .from("ratings")
    .insert({

      reviewer_id: user.id,

      contractor_id:
        selectedApplication.jobs.contractor_id,

      rating,

      comment

    })

  if(error){
    console.error(error)
    alert("You already reviewed this contractor")
    return
  }

  alert("Review submitted ✅")

  setShowRatingModal(false)

  setComment("")
  setRating(5)
}

  const filteredApps = applications.filter(app => {
  const jobTitle = app.jobs?.title?.toLowerCase() || ""

  const matchesTab =
    activeTab === "all"
      ? true
      : app.status === activeTab

  const matchesSearch =
    jobTitle.includes(search.toLowerCase())

  return matchesTab && matchesSearch
})

  // ✅ AUTH LOADING
  if(authLoading){
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
  if(loading){
    return (
      <>
        <WorkerNavbar />
        <div className="worker-dashboard">Loading...</div>
      </>
    )
  }

  return(
    <>
      <WorkerNavbar />

      <div className="worker-dashboard">

        <h1 className="dashboard-title">My Applications 📄</h1>

        {/* 🔍 SEARCH */}
<div className="search-bar">
  <input
    type="text"
    placeholder="Search by job name..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
</div>

{/* 🔥 TABS */}
<div className="tabs">

  <button
    className={activeTab === "all" ? "active" : ""}
    onClick={() => setActiveTab("all")}
  >
    All
  </button>

  <button
    className={activeTab === "pending" ? "active" : ""}
    onClick={() => setActiveTab("pending")}
  >
    Pending
  </button>

  <button
    className={activeTab === "approved" ? "active" : ""}
    onClick={() => setActiveTab("approved")}
  >
    Approved
  </button>

  <button
    className={activeTab === "rejected" ? "active" : ""}
    onClick={() => setActiveTab("rejected")}
  >
    Rejected
  </button>

</div>

<div className="stats-grid">

  <div className="stat-card">
    <h4>Total</h4>
    <p>{applications.length}</p>
  </div>

  <div className="stat-card pending">
    <h4>Pending</h4>
    <p>
      {applications.filter(a => a.status === "pending").length}
    </p>
  </div>

  <div className="stat-card approved">
    <h4>Approved</h4>
    <p>
      {applications.filter(a => a.status === "approved").length}
    </p>
  </div>

  <div className="stat-card rejected">
    <h4>Rejected</h4>
    <p>
      {applications.filter(a => a.status === "rejected").length}
    </p>
  </div>

</div>

        {filteredApps.length === 0 && (
          <div className="empty-state">

  <div className="empty-icon">
    📭
  </div>

  <h3>
  {search
    ? "No matching applications"
    : activeTab !== "all"
    ? `No ${activeTab} applications`
    : "No applications yet"}
</h3>

<p>
  {search
    ? "Try another keyword."
    : "Start applying to jobs and track them here."}
</p>

  <button
    className="browse-btn"
    onClick={() => navigate("/jobs")}
  >
    Browse Jobs
  </button>

</div>
        )}

        <div className="applications-grid">

          {filteredApps.map((app)=> {

            const job = app.jobs

            return(

              <div
  className={`application-card ${app.status}`}
  key={app.id}
>

  {/* 🔥 COMPANY ROW */}
<div className="company-row applications-company-row">

  <img
    src={
      job?.users?.avatar_url
        ? job.users.avatar_url
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
            job?.users?.company_name || job?.users?.full_name || "User"
          )}&background=0D8ABC&color=fff`
    }
    alt="logo"
    className="company-logo"
    onClick={() => navigate(`/contractor/${job?.contractor_id}`)}
  />

  <div>
    <p
  className="company-name"
  onClick={() => navigate(`/contractor/${job?.contractor_id}`)}
  style={{ cursor: "pointer" }}
>
  {job?.users?.company_name || job?.users?.full_name || "Anonymous"}
</p>
  </div>

</div>

  {/* 🔥 STATUS BADGE */}
  <div className={`status-badge ${app.status}`}>

  {app.status === "pending" && "⏳ Pending"}

  {app.status === "approved" && "✅ Approved"}

  {app.status === "rejected" && "❌ Rejected"}

</div>

  <h3 className="job-title">
    {job?.title || "Unknown Job"}
  </h3>

  <div className="app-info">
    <span>📍 {job?.location || "N/A"}</span>
    <span className="salary">₦{job?.salary?.toLocaleString() || "N/A"}/day</span>
  </div>

  <p className="applied-time">
  Applied {getAppliedTime(app.created_at)}
</p>

  <div className="app-actions">

    <button
      className="view-btn"
      onClick={() => navigate(`/job/${job?.id}`)}
    >
      View Job
    </button>

    {app.status === "approved" && (

  <button
    className="rate-btn"
    onClick={() => openRatingModal(app)}
  >
    ⭐ Rate
  </button>

)}

    <button
      className="withdraw-btn"
      onClick={() => {
        if (confirm("Are you sure you want to withdraw?")) {
          withdraw(job?.id)
        }
      }}
    >
      Withdraw
    </button>

  </div>

</div>
            )
          })}

        </div>

      </div>
    {showRatingModal && (

  <div className="modal-overlay">

    <div className="modal">

      <h3>Rate Contractor</h3>

      <select
        value={rating}
        onChange={(e)=>setRating(Number(e.target.value))}
      >

        <option value={5}>5 Stars</option>
        <option value={4}>4 Stars</option>
        <option value={3}>3 Stars</option>
        <option value={2}>2 Stars</option>
        <option value={1}>1 Star</option>

      </select>

      <textarea
        placeholder="Write review..."
        value={comment}
        onChange={(e)=>setComment(e.target.value)}
      />

      <div className="modal-actions">

        <button
          className="btn secondary"
          onClick={() => setShowRatingModal(false)}
        >
          Cancel
        </button>

        <button
          className="btn success"
          onClick={submitRating}
        >
          Submit
        </button>

      </div>

    </div>

  </div>

)}

    </>
  )
}

export default WorkerApplications