import { useEffect, useState } from "react"
import supabase from "../supabaseClient"
import WorkerNavbar from "../components/WorkerNavbar"
import "./WorkerDashboard.css"

function JobsPage() {

  const [jobs, setJobs] = useState([])
  const [appliedJobs, setAppliedJobs] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // ✅ GET AUTH USER
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setCurrentUser(data.user)
    }

    getUser()
  }, [])

  // ✅ FETCH DATA
  useEffect(() => {
    if (!currentUser) return

    fetchAll()
  }, [currentUser])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchJobs(), fetchApplications()])
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
      .select("job_id")
      .eq("worker_id", currentUser.id)

    if (error) {
      console.error("Applications error:", error.message)
      return
    }

    setAppliedJobs(data?.map(app => app.job_id) || [])
  }

  // ✅ APPLY JOB (IMPROVED)
  async function applyJob(jobId) {

    // 🔒 PREVENT DOUBLE CLICK
    if (appliedJobs.includes(jobId)) return

    const { error } = await supabase
      .from("applications")
      .insert({
        job_id: jobId,
        worker_id: currentUser.id,
        status: "pending"
      })

    if (error) {
      console.error(error)
      alert("Something went wrong")
      return
    }

    // ✅ INSTANT UI UPDATE
    setAppliedJobs(prev => [...prev, jobId])
  }

  // ✅ LOADING
  if (loading) {
    return (
      <>
        <WorkerNavbar />
        <div className="worker-dashboard">Loading jobs...</div>
      </>
    )
  }

  return (
    <>
      <WorkerNavbar />

      <div className="worker-dashboard">

        <h1>Available Jobs</h1>

        {jobs.length === 0 && (
          <p style={{ opacity: 0.7 }}>No jobs available yet</p>
        )}

        <div className="worker-jobs-grid">

          {jobs.map((job) => (

            <div className="worker-job-card" key={job.id}>

              <h3>{job.title}</h3>

              {/* 🔥 FUTURE: contractor name */}
              <p style={{ color: "#22c55e", fontWeight: "500" }}>
                Contractor
              </p>

              <p>{job.description}</p>

              <div className="worker-job-info">
                <span>📍 {job.location}</span>
                <span>💰 ₦{job.salary}/day</span>
              </div>

              <button
                className={`worker-apply-btn ${
                  appliedJobs.includes(job.id) ? "applied" : ""
                }`}
                onClick={() => applyJob(job.id)}
                disabled={appliedJobs.includes(job.id)}
              >
                {appliedJobs.includes(job.id) ? "Applied ✓" : "Apply"}
              </button>

            </div>

          ))}

        </div>

      </div>
    </>
  )
}

export default JobsPage