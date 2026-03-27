import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import WorkerNavbar from "../components/WorkerNavbar"
import { useSaved } from "../context/SavedContext"
import "./WorkerDashboard.css"

function WorkerDashboard() {

  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(null)
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [notifications, setNotifications] = useState([]) // 🔔 NEW
  const [loading, setLoading] = useState(true)

  const { savedJobs, toggleSave } = useSaved()

  // ✅ GET AUTH USER
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
      fetchNotifications() // 🔔 NEW
    ])

    setLoading(false)
  }

  // ✅ FETCH JOBS
  async function fetchJobs() {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Jobs error:", error.message)
      return
    }

    setJobs(data || [])
  }

  // ✅ FETCH APPLICATIONS
  async function fetchApplications() {
    const { data, error } = await supabase
      .from("applications")
      .select("id")
      .eq("worker_id", currentUser.id)

    if (error) {
      console.error("Applications error:", error.message)
      return
    }

    setApplications(data || [])
  }

  // 🔔 FETCH NOTIFICATIONS
  async function fetchNotifications() {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Notifications error:", error.message)
      return
    }

    setNotifications(data || [])
  }

  // 🔔 COUNT UNREAD
  const unreadCount = notifications.filter(n => !n.is_read).length

  // ✅ LOADING
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
      {/* 🔔 PASS NOTIFICATIONS TO NAVBAR */}
      <WorkerNavbar unreadCount={unreadCount} notifications={notifications} />

      <div className="worker-dashboard">

        <h1 className="dashboard-title">Worker Dashboard</h1>

        {/* STATS */}
        <div className="worker-top-section">
          <div className="worker-stats">

            <div className="worker-stat-card">
              <h3>Applications</h3>
              <p>{applications.length}</p>
            </div>

            <div className="worker-stat-card">
              <h3>Available Jobs</h3>
              <p>{jobs.length}</p>
            </div>

          </div>
        </div>

        {/* 🔔 QUICK NOTIFICATION PREVIEW */}
        {unreadCount > 0 && (
          <div style={{
            background: "#1e293b",
            padding: "10px 15px",
            borderRadius: "8px",
            marginBottom: "20px"
          }}>
            🔔 You have {unreadCount} new notification(s)
          </div>
        )}

        {/* JOB LIST */}
        <h2>🔥 Jobs</h2>

        <div className="worker-jobs-grid">
          {jobs.length === 0 ? (
            <p>No jobs available</p>
          ) : (
            jobs.map((job) => {

              const isSaved = savedJobs.includes(job.id)

              return (
                <div className="worker-job-card" key={job.id}>

                  <h3>{job.title}</h3>

                  {isSaved && (
                    <span style={{
                      color: "#22c55e",
                      fontSize: "12px"
                    }}>
                      ✓ Saved
                    </span>
                  )}

                  <p>{job.description}</p>

                  <p><b>📍 Location:</b> {job.location}</p>

                  <p>
                    <b>💰 Salary:</b> ₦{job.salary || job.daily_pay || "N/A"}
                  </p>

                  <div className="worker-job-actions">

                    <button
                      className="worker-view-btn"
                      onClick={() => navigate(`/job/${job.id}`)}
                    >
                      View Job
                    </button>

                    <button
                      className={`save-btn ${isSaved ? "saved" : ""}`}
                      onClick={() => toggleSave(job.id)}
                    >
                      {isSaved ? "Saved ✓" : "Save"}
                    </button>

                  </div>

                </div>
              )
            })
          )}
        </div>

      </div>
    </>
  )
}

export default WorkerDashboard