import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import WorkerNavbar from "../components/WorkerNavbar"
import { useSaved } from "../context/SavedContext"
import RatingModal from "../components/RatingModal"
import StarRating from "../components/StarRating"
import "./WorkerDashboard.css"

function WorkerDashboard({ darkMode, setDarkMode }) {

  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(null)
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [notifications, setNotifications] = useState([])
  const [completedJobs, setCompletedJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [loading, setLoading] = useState(true)

  const { savedJobs, toggleSave } = useSaved()

  // ✅ GET USER
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.replace("/login")
        return
      }

      setCurrentUser(user)
    }

    getUser()
  }, [])

  // ✅ FETCH DATA
  useEffect(() => {
    if (!currentUser) return
    fetchData()
  }, [currentUser])

  async function fetchData() {
    await Promise.all([
      fetchJobs(),
      fetchApplications(),
      fetchNotifications(),
      fetchCompletedJobs()
    ])
    setLoading(false)
  }

  // ✅ COMPLETED JOBS
  async function fetchCompletedJobs() {
    const { data } = await supabase
      .from("applications")
      .select("job_id")
      .eq("worker_id", currentUser.id)
      .eq("status", "completed")

    setCompletedJobs(data?.map(a => a.job_id) || [])
  }

  // ✅ FETCH JOBS + RATINGS
  async function fetchJobs() {

    const { data: jobsData, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) return console.error(error)

    const jobsWithRatings = await Promise.all(
      (jobsData || []).map(async (job) => {

        const { data: ratings } = await supabase
          .from("ratings")
          .select("rating")
          .eq("reviewed_id", job.contractor_id)

        let avgRating = "New"
        let totalReviews = 0

        if (ratings && ratings.length > 0) {
          totalReviews = ratings.length
          const sum = ratings.reduce((acc, r) => acc + r.rating, 0)
          avgRating = (sum / totalReviews).toFixed(1)
        }

        return {
          ...job,
          rating: avgRating,
          reviews: totalReviews,
          verified: totalReviews >= 3
        }
      })
    )

    setJobs(jobsWithRatings)
  }

  async function fetchApplications() {
    const { data } = await supabase
      .from("applications")
      .select("id")
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

  const unreadCount = notifications.filter(n => !n.is_read).length

  // ✅ REAL FEATURED LOGIC 🔥
  const featuredJobs = jobs.filter(job => job.is_featured)
  const otherJobs = jobs.filter(job => !job.is_featured)

  if (loading) {
    return (
      <>
        <WorkerNavbar darkMode={darkMode} setDarkMode={setDarkMode} />
        <div className="worker-dashboard">Loading...</div>
      </>
    )
  }

  return (
    <>
      <WorkerNavbar darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="worker-dashboard">

        <h1 className="dashboard-title">Worker Dashboard</h1>

        {/* STATS */}
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

        {/* 🔔 NOTIFICATIONS */}
        {unreadCount > 0 && (
          <div className="notif-banner">
            🔔 You have {unreadCount} new notification(s)
          </div>
        )}

        {/* 💎 FEATURED JOBS */}
        <h2>💎 Featured Jobs</h2>

        <div className="featured-jobs">

          {featuredJobs.length === 0 && (
            <p>No featured jobs yet</p>
          )}

          {featuredJobs.map((job) => {

            const isSaved = savedJobs.includes(job.id)
            const canRate = completedJobs.includes(job.id)

            return (
              <div className="featured-job-card" key={job.id}>

                <span className="featured-tag">💎 Featured</span>

                <div className="job-title-row">
                  <h3
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/contractor/${job.contractor_id}`)}
                  >
                    {job.title}
                  </h3>

                  {job.verified && (
                    <span className="verified-badge">✔ Verified</span>
                  )}
                </div>

                {/* ⭐ RATING */}
                <div className="job-rating">
                  {job.rating === "New" ? (
                    <span style={{ color: "#94a3b8", fontSize: "13px" }}>
                      No ratings yet
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
                  <span>₦{job.salary || job.daily_pay || "N/A"}</span>
                </div>

                <div className="worker-job-actions">

                  <button onClick={() => navigate(`/job/${job.id}`)}>
                    View
                  </button>

                  <button onClick={() => toggleSave(job.id)}>
                    {isSaved ? "Saved" : "Save"}
                  </button>

                  {canRate && (
                    <button onClick={() => setSelectedJob(job)}>
                      ⭐ Rate
                    </button>
                  )}

                </div>

              </div>
            )
          })}
        </div>

        {/* 🔥 OTHER JOBS */}
        <h2>🔥 New Jobs</h2>

        <div className="worker-jobs-grid">

          {otherJobs.map((job) => {

            const isSaved = savedJobs.includes(job.id)
            const canRate = completedJobs.includes(job.id)

            return (
              <div className="worker-job-card" key={job.id}>

                <h3
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/contractor/${job.contractor_id}`)}
                >
                  {job.title}
                </h3>

                <div className="job-rating">
                  {job.rating === "New" ? (
                    "No ratings yet"
                  ) : (
                    <>
                      <StarRating rating={parseFloat(job.rating)} />
                      <span style={{ fontSize: "12px" }}>
                        ({job.reviews})
                      </span>
                    </>
                  )}
                </div>

                <p>{job.description?.slice(0, 100)}...</p>

                <div className="worker-job-actions">

                  <button onClick={() => navigate(`/job/${job.id}`)}>
                    View
                  </button>

                  <button onClick={() => toggleSave(job.id)}>
                    {isSaved ? "Saved" : "Save"}
                  </button>

                  {canRate && (
                    <button onClick={() => setSelectedJob(job)}>
                      ⭐ Rate
                    </button>
                  )}

                </div>

              </div>
            )
          })}

        </div>

      </div>

      {/* ⭐ MODAL */}
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