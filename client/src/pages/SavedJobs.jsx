import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import WorkerNavbar from "../components/WorkerNavbar"
import { useSaved } from "../context/SavedContext"
import "./WorkerDashboard.css"

function SavedJobs() {

  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])

  // ✅ GLOBAL STATE
  const { savedJobs, toggleSave } = useSaved()

  // ✅ FETCH JOBS BASED ON GLOBAL SAVED IDS
  useEffect(() => {
    fetchJobs()
  }, [savedJobs])

  async function fetchJobs() {

    if (savedJobs.length === 0) {
      setJobs([])
      return
    }

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .in("id", savedJobs)

    if (error) {
      console.error("Jobs fetch error:", error.message)
    } else {
      setJobs(data || [])
    }
  }

  return (
    <>
      <WorkerNavbar />

      <div className="worker-dashboard">

        <h1 className="dashboard-title">Saved Jobs ⭐</h1>

        {jobs.length === 0 && (
          <div style={{ textAlign: "center", opacity: 0.7, marginTop: "40px" }}>
            <h3>No saved jobs yet ⭐</h3>
            <p>Save jobs to see them here</p>
          </div>
        )}

        <div className="worker-jobs-grid">

          {jobs.map((job) => (

            <div className="worker-job-card" key={job.id}>

              <h3>{job.title}</h3>

              <p style={{ fontSize: "12px", opacity: 0.7 }}>
                🏷 {job.category || "General"}
              </p>

              <p>{job.description}</p>

              <div className="worker-job-info">
                <span>📍 {job.location}</span>
                <span>💰 ₦{job.salary || job.daily_pay}</span>
              </div>

              <div className="worker-job-actions">

                <button
                  className="worker-view-btn"
                  onClick={() => navigate(`/job/${job.id}`)}
                >
                  View
                </button>

                {/* ✅ GLOBAL REMOVE */}
                <button
                  className="save-btn saved"
                  onClick={() => toggleSave(job.id)}
                >
                  Remove
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>
    </>
  )
}

export default SavedJobs