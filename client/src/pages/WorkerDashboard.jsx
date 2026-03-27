import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import WorkerNavbar from "../components/WorkerNavbar"
import { useSaved } from "../context/SavedContext"
import RatingModal from "../components/RatingModal"
import "./WorkerDashboard.css"

function WorkerDashboard({ darkMode, setDarkMode }) {

  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(null)
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [notifications, setNotifications] = useState([])
  const [completedJobs, setCompletedJobs] = useState([]) // ✅ NEW
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
      fetchCompletedJobs() // ✅ NEW
    ])
    setLoading(false)
  }

  // ✅ FETCH COMPLETED JOBS
  async function fetchCompletedJobs() {
    const { data } = await supabase
      .from("applications")
      .select("job_id")
      .eq("worker_id", currentUser.id)
      .eq("status", "completed")

    const ids = data?.map(a => a.job_id) || []
    setCompletedJobs(ids)
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

  const featuredJobs = jobs.slice(0, 3)
  const otherJobs = jobs.slice(3)

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

        {/* 💎 FEATURED */}
        <h2>💎 Featured Jobs</h2>

        <div className="featured-jobs">
          {featuredJobs.map((job) => {

            const isSaved = savedJobs.includes(job.id)
            const canRate = completedJobs.includes(job.id) // ✅ KEY

            return (
              <div className="featured-job-card" key={job.id}>

                <span className="featured-tag">FEATURED</span>

                <div className="job-title-row">
                  <h3 onClick={() => navigate(`/contractor/${job.contractor_id}`)}>
  {job.title}
</h3>
                  {job.verified && (
                    <span className="verified-badge">✔ Verified</span>
                  )}
                </div>

                <div className="job-rating">
                  {job.rating === "New"
                    ? "No ratings yet"
                    : `⭐ ${job.rating} (${job.reviews})`}
                </div>

                <p>{job.description?.slice(0, 100)}...</p>

                <div className="job-meta">
                  <span>📍 {job.location}</span>
                  <span>₦{job.salary || job.daily_pay}</span>
                </div>

                <div className="worker-job-actions">

                  <button onClick={() => navigate(`/job/${job.id}`)}>
                    View
                  </button>

                  <button onClick={() => toggleSave(job.id)}>
                    {isSaved ? "Saved" : "Save"}
                  </button>

                  {/* ⭐ ONLY IF COMPLETED */}
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

        {/* 🔥 NEW JOBS */}
        <h2>🔥 New Jobs</h2>

        <div className="worker-jobs-grid">
          {otherJobs.map((job) => {

            const isSaved = savedJobs.includes(job.id)
            const canRate = completedJobs.includes(job.id)

            return (
              <div className="worker-job-card" key={job.id}>

                <h3>{job.title}</h3>

                <div className="job-rating">
                  {job.rating === "New"
                    ? "No ratings yet"
                    : `⭐ ${job.rating} (${job.reviews})`}
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