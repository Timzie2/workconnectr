import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"

import ContractorNavbar from "../components/ContractorNavbar"
import "./Dashboard.css"

function ContractorDashboard({ darkMode, setDarkMode }) {

  const navigate = useNavigate()

  const [jobs, setJobs] = useState([])
  const [applicationsCount, setApplicationsCount] = useState(0)
  const [user, setUser] = useState(null)

  useEffect(() => {
    getUserAndJobs()
  }, [])

  const getUserAndJobs = async () => {

    // ✅ GET LOGGED-IN USER
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log("❌ No user found")
      return
    }

    console.log("✅ Logged in user ID:", user.id)

    setUser(user)

    // 🚨 TEMP: REMOVE FILTER TO DEBUG
    const { data: jobsData, error } = await supabase
      .from("jobs")
      .select("*")
      // .eq("contractor_id", user.id)  ❌ TEMP REMOVED
      .order("created_at", { ascending: false })

    if (error) {
      console.log("❌ Jobs error:", error.message)
      return
    }

    console.log("📦 Jobs fetched:", jobsData)

    setJobs(jobsData || [])

    // 🔥 FETCH APPLICATIONS
    fetchApplications(jobsData || [])
  }

  const fetchApplications = async (jobsData) => {

    if (!jobsData || jobsData.length === 0) {
      setApplicationsCount(0)
      return
    }

    const jobIds = jobsData.map(job => job.id)

    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .in("job_id", jobIds)

    if (error) {
      console.log("❌ Applications error:", error.message)
      return
    }

    setApplicationsCount(data.length)
  }

  return (
    <>
      <ContractorNavbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <div className="dashboard-container">

        <h1>Contractor Dashboard</h1>

        <div className="dashboard-actions">

          <button
            className="primary-btn"
            onClick={() => navigate("/post-job")}
          >
            Post New Job
          </button>

          <button
            className="secondary-btn"
            onClick={() => navigate("/contractor-applications")}
          >
            View Applications
          </button>

        </div>

        <div className="stats-container">

          <div className="stat-card">
            <p className="stat-title">Total Jobs</p>
            <h2 className="stat-number">{jobs.length}</h2>
          </div>

          <div className="stat-card">
            <p className="stat-title">Active Jobs</p>
            <h2 className="stat-number">{jobs.length}</h2>
          </div>

          <div className="stat-card">
            <p className="stat-title">Applications</p>
            <h2 className="stat-number">{applicationsCount}</h2>
          </div>

        </div>

        <h2>Your Job Posts</h2>

        {jobs.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No jobs posted yet</p>
        ) : (

          <div className="jobs-grid">

            {jobs.map((job) => (

              <div key={job.id} className="job-card">

                <h3 className="job-title">{job.title}</h3>

                <p className="job-desc">{job.description}</p>

                <div className="job-info">
                  <span>📍 {job.location}</span>
                  <span>💰 ₦{job.salary}/day</span>
                </div>

                <div className="job-tags">
                  <span className="tag">{job.category || "General"}</span>
                </div>

                <div className="job-actions">

                  <button
                    className="edit-btn"
                    onClick={() => navigate(`/edit-job/${job.id}`)}
                  >
                    Edit
                  </button>

                  <button className="delete-btn">
                    Delete
                  </button>

                  <button
                    className="applicants-btn"
                    onClick={() => navigate("/contractor-applications")}
                  >
                    Applicants
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>
    </>
  )
}

export default ContractorDashboard