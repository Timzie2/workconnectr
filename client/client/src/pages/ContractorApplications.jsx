import { useLocation } from "react-router-dom"
import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import supabase from "../supabaseClient"
import ContractorNavbar from "../components/ContractorNavbar"
import { useAuth } from "../context/AuthContext"


function ContractorApplications() {

  const navigate = useNavigate()
  const { jobId } = useParams()

  const { user, loading: authLoading } = useAuth()

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [jobTitle, setJobTitle] = useState("")
  const location = useLocation()

  // 🔥 FETCH DATA
  useEffect(() => {
  if (authLoading) return

  if (!user) return

  if (!jobId) {
    navigate("/contractor-dashboard")
    return
  }

  fetchApplications()

}, [user, authLoading, jobId])

  const fetchApplications = async () => {

    try {
      if (!user || !jobId) return

      setLoading(true)

      // 🔥 GET JOB TITLE
      const { data: job, error: jobError } = await supabase
  .from("jobs")
  .select("title")
  .eq("id", jobId)
  .eq("contractor_id", user.id) // ✅ SECURITY
  .single()

 if (jobError) throw jobError

if (!job) {
  navigate("/contractor-dashboard")
  return
}

      setJobTitle(job?.title || "Job")

      // 🔥 GET APPLICATIONS
      const { data: apps, error: appError } = await supabase
        .from("applications")
        .select(`
          *,
          users:worker_id (
            full_name,
            skills
          )
        `)
        .eq("job_id", jobId)
        .order("created_at", { ascending: false })

      if (appError) throw appError

      if (!apps || apps.length === 0) {
        setApplications([])
        setLoading(false)
        return
      }

      // ⭐ ADD RATINGS
      // 🔥 get all worker IDs
const workerIds = [...new Set(apps.map(app => app.worker_id))]

const { data: ratingsData } = workerIds.length
  ? await supabase
      .from("ratings")
      .select("reviewed_id, rating")
      .in("reviewed_id", workerIds)
  : { data: [] }

// 🔥 map ratings
const formattedApps = apps.map(app => {
  const workerRatings = ratingsData?.filter(
    r => r.reviewed_id === app.worker_id
  ) || []

  let avgRating = 0
  let ratingCount = 0

  if (workerRatings.length > 0) {
    const total = workerRatings.reduce((sum, r) => sum + r.rating, 0)
    avgRating = (total / workerRatings.length).toFixed(1)
    ratingCount = workerRatings.length
  }

  return {
    ...app,
    avgRating,
    ratingCount
  }
})
  

      setApplications(formattedApps)

    } catch (err) {
      console.error("Fetch error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  // ✅ APPROVE
  const approveWorker = async (app) => {

    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: "approved" })
        .eq("id", app.id)

      if (error) throw error

      await supabase.from("notifications").insert({
        user_id: app.worker_id,
        message: "🎉 Your job application was approved!"
      })

      fetchApplications()
      navigate(`/chat/${app.worker_id}`)

    } catch (err) {
      alert("Failed to approve worker")
    }
  }

  // ❌ REJECT
  const rejectWorker = async (id, worker_id) => {

    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: "rejected" })
        .eq("id", id)

      if (error) throw error

      await supabase.from("notifications").insert({
        user_id: worker_id,
        message: "❌ Your application was rejected"
      })

      fetchApplications()

    } catch (err) {
      console.error(err.message)
    }
  }

  const handleBack = () => {
  if (location.state?.from === "dashboard") {
    navigate("/contractor-dashboard")
  } else if (location.state?.from === "all-applicants") {
    navigate("/contractor-applications")
  } else {
    navigate("/contractor-dashboard") // fallback
  }
}

  // 🔄 AUTH LOADING
  if (authLoading) {
    return <p style={{ padding: "20px" }}>Loading...</p>
  }

  if (!user) {
    return null
  }

  return (
    <div>

      <ContractorNavbar />

      <div className="dashboard-container">

        {/* 🔙 BACK */}
        <button
  className="back-btn"
  onClick={handleBack}
>
  ⬅ Back
</button>

        <h2 className="dashboard-title">
          Applicants for: {jobTitle}
        </h2>

        {loading && <p>Loading...</p>}

        {!loading && applications.length === 0 && (
          <p>No applications yet</p>
        )}

        <div className="jobs-grid">

          {applications.map((app) => (

            <div key={app.id} className="job-card">

              <p><strong>{jobTitle}</strong></p>

              <p>
                👤 {app.users?.full_name || "Unknown Worker"}
              </p>

              <p>
                🛠 {app.users?.skills || "No skills listed"}
              </p>

              {app.ratingCount > 0 ? (
  <p>⭐ {app.avgRating} / 5 ({app.ratingCount})</p>
) : (
  <p style={{ opacity: 0.6 }}>⭐ No ratings yet</p>
)}

              <p className={`status ${app.status}`}>
                {app.status}
              </p>

              <div className="job-actions">

                {app.status === "pending" && (
                  <>
                    <button
                      className="approve-btn"
                      onClick={() => approveWorker(app)}
                    >
                      ✅ Approve
                    </button>

                    <button
                      className="reject-btn"
                      onClick={() => rejectWorker(app.id, app.worker_id)}
                    >
                      ❌ Reject
                    </button>
                  </>
                )}

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

      </div>

    </div>
  )
}

export default ContractorApplications