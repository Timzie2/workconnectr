import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"

import ContractorNavbar from "../components/ContractorNavbar"
import PayButton from "../components/PaystackButton"
import "./Dashboard.css"

function ContractorDashboard({ darkMode, setDarkMode }) {

  const navigate = useNavigate()

  const [jobs, setJobs] = useState([])
  const [applicationsCount, setApplicationsCount] = useState(0)
  const [user, setUser] = useState(null)

  // ✅ GLOBAL LOADING STATE (VERY IMPORTANT 🔥)
  const [loadingJobId, setLoadingJobId] = useState(null)

  useEffect(() => {
    getUserAndJobs()
  }, [])

  const getUserAndJobs = async () => {

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      window.location.replace("/login")
      return
    }

    setUser(user)

    const { data: jobsData, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("contractor_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.log("Jobs error:", error.message)
      return
    }

    setJobs(jobsData || [])
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

    if (!error) {
      setApplicationsCount(data.length)
    }
  }

  // ✅ DELETE JOB
  const deleteJob = async (id) => {

    const confirmDelete = window.confirm("Delete this job?")
    if (!confirmDelete) return

    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", id)

    if (error) {
      alert("Failed to delete job")
      return
    }

    setJobs(prev => prev.filter(job => job.id !== id))
  }

  return (
    <>
      <ContractorNavbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <div className="dashboard-container">

        <h1 className="dashboard-title">Contractor Dashboard</h1>

        {/* ACTIONS */}
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

        {/* STATS */}
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

        {jobs.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No jobs posted yet</p>
        ) : (

          <div className="jobs-grid">

            {jobs.map((job) => (

              <div key={job.id} className="job-card">

                {/* 💎 FEATURED */}
                {job.is_featured && (
                  <span className="featured-tag">💎 Featured</span>
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

                {/* ACTIONS */}
                <div className="job-actions">

                  {/* LEFT */}
                  <div className="job-actions-left">

                    <button
                      className="edit-btn"
                      onClick={() => navigate(`/edit-job/${job.id}`)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deleteJob(job.id)}
                    >
                      Delete
                    </button>

                    <button
                      className="applicants-btn"
                      onClick={() => navigate("/contractor-applications")}
                    >
                      Applicants
                    </button>

                  </div>

                  {/* RIGHT → PAYSTACK */}
                  <div className="job-actions-right">

                    {!job.is_featured ? (
                      <PayButton
                        jobId={job.id}
                        email={user?.email}
                        userId={user?.id}

                        // ✅ CONTROL LOADING FROM PARENT
                        loading={loadingJobId === job.id}
                        startLoading={() => setLoadingJobId(job.id)}
                        stopLoading={() => setLoadingJobId(null)}

                        onSuccess={() => {
                          setJobs(prev =>
                            prev.map(j =>
                              j.id === job.id
                                ? { ...j, is_featured: true }
                                : j
                            )
                          )
                          setLoadingJobId(null) // 🔥 RESET
                        }}
                      />
                    ) : (
                      <button className="boosted-btn">
                        🚀 Boosted
                      </button>
                    )}

                  </div>

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