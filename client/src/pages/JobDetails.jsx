import { useSaved } from "../context/SavedContext"
import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import supabase from "../supabaseClient"
import WorkerNavbar from "../components/WorkerNavbar"
import "./WorkerDashboard.css"

function JobDetails() {

  const { id } = useParams()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)

  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)

  // ✅ GLOBAL SAVE SYSTEM
  const { savedJobs, toggleSave } = useSaved()
  const saved = savedJobs.includes(Number(id))

  // ✅ INITIAL LOAD
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    await Promise.all([
      fetchJob(),
      checkIfApplied()
    ])
    setLoading(false)
  }

  // ✅ FETCH JOB
  async function fetchJob() {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single()

    if (!error) setJob(data)
    else console.error(error.message)
  }

  // ✅ CHECK APPLICATION
  async function checkIfApplied() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", id)
      .eq("worker_id", user.id)
      .maybeSingle()

    if (data) setApplied(true)
  }

  // ✅ APPLY / UNAPPLY
  async function applyJob() {

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 🔴 UNAPPLY
    if (applied) {

      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("job_id", job.id)
        .eq("worker_id", user.id)

      if (!error) {

        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "application",
          message: `You withdrew application for ${job.title}`
        })

        setApplied(false)
      }

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

    if (!error) {

      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "application",
        message: `You applied for ${job.title}`
      })

      setApplied(true)
    }

    setApplying(false)
  }

  // ✅ STATES
  if (loading) return <div className="worker-dashboard">Loading...</div>
  if (!job) return <div className="worker-dashboard">Job not found</div>

  return (
    <>
      <WorkerNavbar />

      <div className="worker-dashboard">

        {/* HEADER */}
        <div className="job-header">
          <button 
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
        </div>

        {/* JOB CARD */}
        <div className="job-details-card">

          <h1 className="job-title">{job.title}</h1>

          <p className="job-company">
            {job.company_name || "Company"}
          </p>

          <p className="job-description">{job.description}</p>

          <div className="job-info">
            <p>📍 {job.location}</p>
            <p>💰 ₦{job.salary}/day</p>
            <p>📅 {new Date(job.created_at).toDateString()}</p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="job-actions">

            <button
              className={`apply-btn ${applied ? "withdraw" : ""}`}
              onClick={applyJob}
              disabled={applying}
            >
              {applying
                ? "Processing..."
                : applied
                ? "Withdraw Application"
                : "Apply Now"}
            </button>

            {/* ✅ GLOBAL SAVE BUTTON */}
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