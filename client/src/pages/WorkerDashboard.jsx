import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import WorkerNavbar from "../components/WorkerNavbar"
import { useSaved } from "../context/SavedContext"
import RatingModal from "../components/RatingModal"
import StarRating from "../components/StarRating"
import "../styles/WorkerDashboard.css"

function WorkerDashboard() {

  const navigate = useNavigate()
  const { user } = useAuth()

  const [currentUser, setCurrentUser] = useState(null)
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [notifications, setNotifications] = useState([])
  const [completedJobs, setCompletedJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userSkills, setUserSkills] = useState("")

  const { savedJobs, toggleSave } = useSaved()

  // ✅ FIXED AUTH (NO LOGOUT 🔥)
  useEffect(() => {
  if (user) {
    setCurrentUser(user)
  }
}, [user])

useEffect(() => {
  if (!currentUser) return

  const channel = supabase
    .channel("jobs-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "jobs",
      },
      () => {
        console.log("Jobs updated 🔥")
        fetchJobs() // 🔥 auto refresh jobs
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [currentUser])

  // ✅ FETCH DATA
  useEffect(() => {
    if (!currentUser) return
    fetchData()
  }, [currentUser])

  async function fetchData() {
  await Promise.all([
    fetchUserProfile(),  
    fetchJobs(),
    fetchApplications(),
    fetchNotifications(),
    fetchCompletedJobs()
  ])
  setLoading(false)
}

  async function fetchCompletedJobs() {
    const { data } = await supabase
      .from("applications")
      .select("job_id")
      .eq("worker_id", currentUser.id)
      .eq("status", "completed")

    setCompletedJobs(data?.map(a => a.job_id) || [])
  }

  async function fetchUserProfile() {
  const { data } = await supabase
    .from("users")
    .select("skills")
    .eq("id", currentUser.id)
    .single()

  if (data) {
    setUserSkills(data.skills || "")
  }
}

  async function fetchJobs() {

  const { data: jobsData, error } = await supabase
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
    .order("created_at", { ascending: false })

  if (error) return console.error(error)

  const contractorIds = (jobsData || []).map(j => j.contractor_id)

  const { data: ratingsData } = await supabase
    .from("ratings")
    .select("contractor_id, rating")
    .in("contractor_id", contractorIds)

  const now = new Date()

const cleanedJobs = (jobsData || []).map(job => {
  if (job.is_featured && job.feature_expires_at) {
    if (new Date(job.feature_expires_at) < now) {
      return { ...job, is_featured: false }
    }
  }
  return job
})

    const jobsWithRatings = cleanedJobs.map(job => {
      const isNew =
  new Date(job.created_at) >
  new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days

  // ✅ FORCE USERS FALLBACK (VERY IMPORTANT)
  const safeUser = job.users || {
    full_name: "Anonymous",
    company_name: null,
    avatar_url: null
  }

  const jobRatings = ratingsData?.filter(
    r => r.contractor_id === job.contractor_id
  ) || []

  let avgRating = "New"
  let totalReviews = 0

  if (jobRatings.length > 0) {
    totalReviews = jobRatings.length
    const sum = jobRatings.reduce((acc, r) => acc + r.rating, 0)
    avgRating = (sum / totalReviews).toFixed(1)
  }

  return {
    ...job,
    users: safeUser, // ✅ THIS LINE FIXES EVERYTHING
    rating: avgRating,
    reviews: totalReviews,
    verified: totalReviews >= 3,
    isNew
  }
})

  setJobs(jobsWithRatings)
}

  async function fetchApplications() {
    const { data } = await supabase
  .from("applications")
  .select("job_id, status")
  .eq("worker_id", currentUser.id)

    setApplications(data || [])
  }

  async function fetchNotifications() {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })

    setNotifications(data || [])
  }

  async function applyToJob(jobId) {
  const application = applications.find(a => a.job_id === jobId)
const alreadyApplied = !!application

  // ✅ If already applied → stop completely
  if (alreadyApplied) {
    return
  }

  const { error } = await supabase
    .from("applications")
    .insert({
      job_id: jobId,
      worker_id: currentUser.id,
      status: "pending"
    })

  // 🔥 KEY FIX HERE
  if (error) {
    console.log("Apply error:", error)

    // ✅ If duplicate → ignore silently
    if (error.code === "23505") {
      setApplications(prev => [
  ...prev,
  { job_id: jobId, status: "pending" }
])
      return
    }

    alert("❌ Error applying")
    return
  }

  // ✅ Normal success
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
    .eq("worker_id", currentUser.id)

  if (error) {
    alert("Failed to withdraw")
    return
  }

  fetchApplications() // refresh UI
}

  const unreadCount = notifications.filter(n => !n.is_read).length

  const featuredJobs = jobs
  .filter(job =>
    job.is_featured &&
    (!job.feature_expires_at || new Date(job.feature_expires_at) > new Date())
  )
  .sort((a, b) => {
    if (a.status === "closed") return 1
    if (b.status === "closed") return -1
    return 0
  })
const otherJobs = jobs
  .filter(job => !job.is_featured)
  .slice(0, 6)

const recommendedJobs = jobs
  .map(job => {
    let score = 0

    const skills = userSkills?.toLowerCase() || ""
    const title = job.title?.toLowerCase() || ""
    const desc = job.description?.toLowerCase() || ""

    // 🔥 Skill match (improved)
    const skillList = skills.split(/,|\s+/)

    skillList.forEach(skill => {
      const s = skill.trim()
      if (!s) return

      if (title.includes(s) || desc.includes(s)) {
        score += 5
      }
    })

    // 🔥 Location match
    if (
      job.location &&
      currentUser?.location &&
      job.location.toLowerCase().includes(currentUser.location.toLowerCase())
    ) {
      score += 3
    }

    // 🔥 New jobs boost
    if (job.isNew) {
      score += 2
    }

    return { ...job, score }
  })
  .sort((a, b) => b.score - a.score)
  .filter(job => job.score > 0)
  .slice(0, 4)

// ✅ FALLBACK
const finalRecommended =
  recommendedJobs.length > 0
    ? recommendedJobs
    : jobs.slice(0, 4)

  if (loading) {
    return (
      <>
        <WorkerNavbar />
        <div className="worker-dashboard">Loading...</div>
      </>
    )
  }

  return (
    <>
      <WorkerNavbar />

      <div className="worker-dashboard">

        <h1 className="dashboard-title">Worker Dashboard</h1>

        <div className="worker-stats">
          <div className="worker-stat-card">
            <h3>Applications</h3>
            <p>{applications.length}</p>
          </div>

          <div className="worker-stat-card">
            <h3>Jobs</h3>
            <p>{jobs.length}</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <div className="notif-banner">
            🔔 You have {unreadCount} new notification(s)
          </div>
        )}

        <h2 className="section-title">💎 Featured Jobs</h2>

        <div className="featured-jobs">

          {featuredJobs.length === 0 && (
            <p>No featured jobs yet</p>
          )}

          {featuredJobs.map((job) => {

            const isSaved = savedJobs.includes(job.id)
            const canRate = completedJobs.includes(job.id)
            const application = applications.find(a => a.job_id === job.id)
const alreadyApplied = !!application
const status = application?.status
            const isClosed = job.status === "closed"

            return (
              <div
  className={`featured-job-card glow ${isClosed ? "closed" : ""}`}
  key={job.id}
>

  {alreadyApplied && (
    <span className="applied-badge">✔ Applied</span>
  )}

  {isClosed && (
  <span className="closed-badge">
  {alreadyApplied ? "Closed • Applied" : "Closed"}
</span>
)}

                <span className="featured-tag">💎 Featured</span>

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
    <h4
      className="company-name"
      onClick={(e) => {
        e.stopPropagation()
        navigate(`/contractor/${job.contractor_id}`)
      }}
    >
      {job.users?.company_name || job.users?.full_name || "Anonymous Contractor"}
    </h4>

    <h3>{job.title}</h3>
  </div>

</div>

                <div className="job-rating">
                  {job.rating === "New" ? (
                    <span style={{ color: "var(--text-secondary)" }}>
  ⭐ New
</span>
                  ) : (
                    <>
                      <StarRating rating={parseFloat(job.rating)} />
                      <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                        ({job.reviews})
                      </span>
                    </>
                  )}
                </div>

                <p>{job.description?.slice(0, 100)}...</p>

                <div className="job-meta">
                  <span>📍 {job.location || "Remote"}</span>
                  <span>
  ₦{job.salary || "N/A"}{" "}
  {job.pay_type
    ? job.pay_type === "fixed"
      ? "(fixed)"
      : `/ ${job.pay_type.replace("ly", "")}`
    : ""}
</span>
                </div>
                {status === "pending" && (
  <span className="status-badge pending">⏳ Pending</span>
)}
{status === "accepted" && (
  <span className="status-badge accepted">✅ Accepted</span>
)}
{status === "rejected" && (
  <span className="status-badge rejected">❌ Rejected</span>
)}

                <div className="worker-job-actions">

  <button
    className="btn primary"
    onClick={(e) => {
  e.stopPropagation()
  navigate(`/job/${job.id}`)
}}
  >
    View
  </button>

  <button
  className="btn secondary"
  onClick={(e) => {
    e.stopPropagation()
    toggleSave(job.id)
  }}
>
  {isSaved ? "Saved" : "Save"}
</button>

  {alreadyApplied ? (
  status === "pending" ? (
    <button
      className="btn danger"
      onClick={(e) => {
        e.stopPropagation()
        withdrawApplication(job.id)
      }}
    >
      ❌ Withdraw
    </button>
  ) : status === "accepted" ? (
    <button className="btn success" disabled>
      ✅ Accepted
    </button>
  ) : (
    <button className="btn secondary" disabled>
      ❌ Rejected
    </button>
  )
) : (
  <button
    className="btn success"
    disabled={isClosed}
    onClick={(e) => {
      e.stopPropagation()
      applyToJob(job.id)
    }}
  >
    {isClosed ? "Closed" : "Apply"}
  </button>
)}

  {canRate && (
    <button
      className="btn warning"
      onClick={(e) => {
    e.stopPropagation() 
    setSelectedJob(job)}}
    >
      ⭐ Rate
    </button>
  )}

</div>

              </div>
            )
          })}
        </div>

        <div className="section-header">
  <h2>🎯 Recommended for You</h2>

  <button
    className="view-more-btn"
    onClick={() =>
      navigate(`/jobs?search=${encodeURIComponent(userSkills || "")}`)
    }
  >
    View More →
  </button>
</div>

<div className="worker-jobs-grid">
  {finalRecommended.map((job) => {

    const application = applications.find(a => a.job_id === job.id)
const alreadyApplied = !!application
const status = application?.status
    const isSaved = savedJobs.includes(job.id)
    const isClosed = job.status === "closed"

    return (
      <div
  className={`worker-job-card recommended ${isClosed ? "closed" : ""}`}
  key={job.id}
>

        {/* ✅ APPLIED BADGE */}
        {alreadyApplied && (
          <span className="applied-badge">✔ Applied</span>
        )}

        {isClosed && (
  <span className="closed-badge">
  {alreadyApplied ? "Closed • Applied" : "Closed"}
</span>
)}

        {/* 🎯 MATCH BADGE */}
        <span className="recommended-badge">🎯 Match</span>

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
  <h4
    className="company-name"
    onClick={(e) => {
      e.stopPropagation()
      navigate(`/contractor/${job.contractor_id}`)
    }}
  >
    {job.users?.company_name || job.users?.full_name || "Anonymous Contractor"}
  </h4>

  <h3>{job.title}</h3>
</div>

</div>

        <p>{job.description?.slice(0, 80)}...</p>

        {status === "pending" && (
  <span className="status-badge pending">⏳ Pending</span>
)}
{status === "accepted" && (
  <span className="status-badge accepted">✅ Accepted</span>
)}
{status === "rejected" && (
  <span className="status-badge rejected">❌ Rejected</span>
)}

        <div className="worker-job-actions">

          <button
            className="btn primary"
            onClick={(e) => {
    e.stopPropagation()
     navigate(`/job/${job.id}`)}}
          >
            View
          </button>

          <button
            className="btn secondary"
            onClick={(e) => {
    e.stopPropagation()
     toggleSave(job.id)}}
          >
            {isSaved ? "Saved" : "Save"}
          </button>

          {alreadyApplied ? (
  status === "pending" ? (
    <button
      className="btn danger"
      onClick={(e) => {
        e.stopPropagation()
        withdrawApplication(job.id)
      }}
    >
      ❌ Withdraw
    </button>
  ) : status === "accepted" ? (
    <button className="btn success" disabled>
      ✅ Accepted
    </button>
  ) : (
    <button className="btn secondary" disabled>
      ❌ Rejected
    </button>
  )
) : (
  <button
    className="btn success"
    disabled={isClosed}
    onClick={(e) => {
      e.stopPropagation()
      applyToJob(job.id)
    }}
  >
    {isClosed ? "Closed" : "Apply"}
  </button>
)}

        </div>

      </div>
    )
  })}
</div>

        <div className="section-header">
  <h2>🔥 New Jobs</h2>

  <button
    className="view-more-btn"
    onClick={() => navigate("/jobs")}
  >
    View More →
  </button>
</div>

        <div className="worker-jobs-grid">

          {otherJobs.map((job) => {

            const isSaved = savedJobs.includes(job.id)
            const canRate = completedJobs.includes(job.id)
            const application = applications.find(a => a.job_id === job.id)
const alreadyApplied = !!application
const status = application?.status
            const isClosed = job.status === "closed"

            return (
              <div
  className={`worker-job-card ${isClosed ? "closed" : ""}`}
  key={job.id}
>

  {alreadyApplied && (
    <span className="applied-badge">✔ Applied</span>
  )}

  {isClosed && (
  <span className="closed-badge">
  {alreadyApplied ? "Closed • Applied" : "Closed"}
</span>
)}

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
    <h4
      className="company-name"
      onClick={(e) => {
        e.stopPropagation()
        navigate(`/contractor/${job.contractor_id}`)
      }}
    >
      {job.users?.company_name || job.users?.full_name || "Anonymous Contractor"}
    </h4>

    <h3>{job.title}</h3>
  </div>

  {job.verified && (
    <span className="verified-badge">✔</span>
  )}

</div>

<div className="job-rating">
  {job.isNew ? (
    <span className="rating-new">🔥 New</span>
  ) : job.rating === "New" ? (
    <span className="rating-new">⭐ No ratings</span>
  ) : (
    <>
      <StarRating rating={parseFloat(job.rating)} />
      <span>({job.reviews})</span>
    </>
  )}
</div>

<p className="job-desc">
  {job.description?.slice(0, 80)}...
</p>

<div className="job-meta">
  <span>📍 {job.location || "Remote"}</span>
  <span className="job-salary">
    ₦{job.salary || job.daily_pay || "N/A"}
  </span>
</div>

{status === "pending" && (
  <span className="status-badge pending">⏳ Pending</span>
)}
{status === "accepted" && (
  <span className="status-badge accepted">✅ Accepted</span>
)}
{status === "rejected" && (
  <span className="status-badge rejected">❌ Rejected</span>
)}

                <div className="worker-job-actions">

  <button
    className="btn primary"
    onClick={(e) => {
    e.stopPropagation()
    navigate(`/job/${job.id}`)}}
  >
    View
  </button>

  <button
    className="btn secondary"
    onClick={(e) => {
    e.stopPropagation()
     toggleSave(job.id)}}
  >
    {isSaved ? "Saved" : "Save"}
  </button>

 {alreadyApplied ? (
  status === "pending" ? (
    <button
      className="btn danger"
      onClick={(e) => {
        e.stopPropagation()
        withdrawApplication(job.id)
      }}
    >
      ❌ Withdraw
    </button>
  ) : status === "accepted" ? (
    <button className="btn success" disabled>
      ✅ Accepted
    </button>
  ) : (
    <button className="btn secondary" disabled>
      ❌ Rejected
    </button>
  )
) : (
  <button
    className="btn success"
    disabled={isClosed}
    onClick={(e) => {
      e.stopPropagation()
      applyToJob(job.id)
    }}
  >
    {isClosed ? "Closed" : "Apply"}
  </button>
)}

  {canRate && (
    <button
      className="btn success"
      onClick={(e) => {
    e.stopPropagation()
     setSelectedJob(job)}}
    >
      ⭐ Rate
    </button>
  )}

</div>

              </div>
            )
          })}

        </div>

      </div>

      {selectedJob && (
        <RatingModal
          job={selectedJob}
          user={currentUser}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </>
  )
}

export default WorkerDashboard
