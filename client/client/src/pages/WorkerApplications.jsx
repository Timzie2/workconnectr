import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import WorkerNavbar from "../components/WorkerNavbar"
import { useAuth } from "../context/AuthContext"
import "../styles/WorkerDashboard.css"

function WorkerApplications(){

  const navigate = useNavigate()

  const { user, loading: authLoading } = useAuth()

  const [applications,setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  // ✅ SAFE REDIRECT
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login")
    }
  }, [user, authLoading, navigate])

  // ✅ LOAD AFTER AUTH
  useEffect(()=>{
    if (!authLoading && user) {
      fetchApplications()
    }
  },[user, authLoading])

  // ✅ FETCH APPLICATIONS
  async function fetchApplications(){

    if (!user) return

    setLoading(true)

    const { data,error } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        job_id,
        jobs (
          id,
          title,
          location,
          salary
        )
      `)
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false })

    if(error){
      console.error("Applications error:", error.message)
    } else {
      setApplications(data || [])
    }

    setLoading(false)
  }

  // ✅ WITHDRAW APPLICATION
  async function withdraw(jobId){

    if (!user) return

    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("worker_id", user.id)
      .eq("job_id", jobId)

    if(error){
      console.error("Withdraw error:", error.message)
      return
    }

    // ✅ INSTANT UI UPDATE
    setApplications(prev =>
      prev.filter(app => app.job_id !== jobId)
    )
  }

  // ✅ AUTH LOADING
  if(authLoading){
    return (
      <>
        <WorkerNavbar />
        <div className="worker-dashboard">Loading...</div>
      </>
    )
  }

  // ✅ BLOCK RENDER UNTIL REDIRECT
  if (!user) return null

  // ✅ PAGE LOADING
  if(loading){
    return (
      <>
        <WorkerNavbar />
        <div className="worker-dashboard">Loading...</div>
      </>
    )
  }

  return(
    <>
      <WorkerNavbar />

      <div className="worker-dashboard">

        <h1 className="dashboard-title">My Applications 📄</h1>

        {applications.length === 0 && (
          <div style={{ textAlign: "center", marginTop: "40px", opacity: 0.7 }}>
            <h3>No applications yet</h3>
            <p>Apply to jobs to see them here</p>
          </div>
        )}

        <div className="worker-jobs-grid">

          {applications.map((app)=> {

            const job = app.jobs

            return(
              <div className="worker-job-card" key={app.id}>

                <h3>{job?.title || "Unknown Job"}</h3>

                <div className="worker-job-info">
                  <span>📍 {job?.location || "N/A"}</span>
                  <span>💰 ₦{job?.salary || "N/A"}/day</span>
                </div>

                <p style={{
                  marginTop:"10px",
                  fontWeight:"500",
                  color:
                    app.status === "approved"
                    ? "#22c55e"
                    : app.status === "rejected"
                    ? "#ef4444"
                    : "#facc15"
                }}>
                  ● {app.status}
                </p>

                <div className="worker-job-actions">

                  <button
                    className="worker-view-btn"
                    onClick={() => navigate(`/job/${job?.id}`)}
                  >
                    View Job
                  </button>

                  <button
                    className="apply-btn withdraw"
                    onClick={() => withdraw(job?.id)}
                  >
                    Withdraw
                  </button>

                </div>

              </div>
            )
          })}

        </div>

      </div>
    </>
  )
}

export default WorkerApplications