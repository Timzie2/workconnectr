import "../styles/contractorapplications.css"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import ContractorNavbar from "../components/ContractorNavbar"
import { useAuth } from "../context/AuthContext"


function ContractorApplicationsAll() {

  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && user) {
      fetchApplications()
    }
  }, [user, authLoading])

  const fetchApplications = async () => {

    if (!user) return

    setLoading(true)

    // ✅ GET ALL CONTRACTOR JOBS
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, title")
      .eq("contractor_id", user.id)

    if (!jobs || jobs.length === 0) {
      setApplications([])
      setLoading(false)
      return
    }

    const jobMap = {}
    jobs.forEach(job => {
      jobMap[job.id] = job.title
    })

    const jobIds = jobs.map(job => job.id)

    // ✅ GET ALL APPLICATIONS
    const { data: apps } = await supabase
      .from("applications")
      .select(`
        *,
        users:worker_id (
          full_name,
          skills
        )
      `)
      .in("job_id", jobIds)
      .order("created_at", { ascending: false })

    if (!apps) {
      setApplications([])
      setLoading(false)
      return
    }

    const grouped = {}

apps.forEach(app => {
  const jobId = app.job_id

  if (!grouped[jobId]) {
    grouped[jobId] = {
      jobTitle: jobMap[jobId] || "Unknown Job",
      applicants: []
    }
  }

  grouped[jobId].applicants.push(app)
})

setApplications(Object.entries(grouped))

    setLoading(false)
  }

  if (authLoading) return <p style={{ padding: "20px" }}>Loading...</p>

  if (!user) {
    navigate("/login")
    return null
  }

  return (
    <div>

      <ContractorNavbar />

      <div className="dashboard-container">

        <h2 className="dashboard-title">All Applicants</h2>

        {loading && <p>Loading...</p>}

        {!loading && applications.length === 0 && (
          <p>No applications yet</p>
        )}

        <div className="jobs-grid">

  {applications.map(([jobId, jobData]) => {

    const total = jobData.applicants.length
    const pending = jobData.applicants.filter(a => a.status === "pending").length
    const approved = jobData.applicants.filter(a => a.status === "approved").length
    const rejected = jobData.applicants.filter(a => a.status === "rejected").length

    return (
      <div key={jobId} className="job-card grouped-card">

        {/* 🔥 HEADER */}
        <div className="group-header">
          <h3 className="job-group-title">
            {jobData.jobTitle}
          </h3>

          <span className="total-badge">
            {total} applicant{total !== 1 && "s"}
          </span>
        </div>

        {/* 🔥 STATS */}
        <div className="job-stats">
          <span>🟡 {pending}</span>
          <span>🟢 {approved}</span>
          <span>🔴 {rejected}</span>
        </div>

        {/* 🔥 APPLICANTS */}
        {jobData.applicants.map(app => (

          <div key={app.id} className="applicant-card">

            {app.status === "pending" && (
  <div className="new-request-badge">
    <span className="pulse-dot"></span>
    New Request
  </div>
)}

            <div className="applicant-header">
              <p className="applicant-name">
                👤 {app.users?.full_name || "Unknown Worker"}
              </p>    
            </div>

            <p className="applicant-skill">
              🛠 {app.users?.skills || "No skills listed"}
            </p>

            <p className={`status-badge ${app.status}`}>
              {app.status}
            </p>

            <div className="job-actions">

              <button
                className="view-btn"
                onClick={() =>
                  navigate(`/contractor-applications/${jobId}`, {
                    state: { from: "all-applicants" }
                  })
                }
              >
                View Applicants
              </button>

              {app.status === "approved" && (
                <button
                  className="message-btn"
                  onClick={() => navigate(`/chat/${app.worker_id}`)}
                >
                  💬 Message
                </button>
              )}

            </div>

          </div>

        ))}

      </div>
    )
  })}

</div>

      </div>

    </div>
  )
}

export default ContractorApplicationsAll