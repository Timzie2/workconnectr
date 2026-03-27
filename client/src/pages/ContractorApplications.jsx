import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import supabase from "../supabaseClient"
import ContractorNavbar from "../components/ContractorNavbar"

function ContractorApplications({ darkMode, setDarkMode }) {

  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    // ✅ GET CONTRACTOR JOBS
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

    // ✅ GET APPLICATIONS + USER DATA
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

    // ⭐ ADD RATINGS
    const formattedApps = await Promise.all(
      apps.map(async (app) => {

        const { data: ratings } = await supabase
          .from("ratings")
          .select("rating")
          .eq("reviewed_id", app.worker_id)

        let avgRating = 0
        let ratingCount = 0

        if (ratings && ratings.length > 0) {
          const total = ratings.reduce((sum, r) => sum + r.rating, 0)
          avgRating = (total / ratings.length).toFixed(1)
          ratingCount = ratings.length
        }

        return {
          ...app,
          jobTitle: jobMap[app.job_id] || "Unknown Job",
          avgRating,
          ratingCount
        }
      })
    )

    setApplications(formattedApps)
    setLoading(false)
  }

  // ✅ APPROVE WORKER
  const approveWorker = async (app) => {

    try {
      // 1. Update application
      const { error: updateError } = await supabase
        .from("applications")
        .update({ status: "approved" })
        .eq("id", app.id)

      if (updateError) throw updateError

      // 2. Send notification (SAFE)
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: app.worker_id,
          message: "🎉 Your job application was approved!"
        })

      // ⚠️ Do NOT break flow if notification fails
      if (notifError) {
        console.warn("Notification failed:", notifError.message)
      }

      fetchApplications()
      navigate(`/chat/${app.worker_id}`)

    } catch (err) {
      console.error("Approve error:", err.message)
      alert("Something went wrong")
    }
  }

  // ✅ REJECT WORKER
  const rejectWorker = async (id, worker_id) => {

    try {
      const { error: updateError } = await supabase
        .from("applications")
        .update({ status: "rejected" })
        .eq("id", id)

      if (updateError) throw updateError

      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: worker_id,
          message: "❌ Your application was rejected"
        })

      if (notifError) {
        console.warn("Notification failed:", notifError.message)
      }

      fetchApplications()

    } catch (err) {
      console.error("Reject error:", err.message)
    }
  }

  return (
    <div>

      <ContractorNavbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <div style={{ padding: "40px" }}>

        <h2>Job Applicants</h2>

        {loading && <p>Loading...</p>}

        {!loading && applications.length === 0 && (
          <p>No applications yet</p>
        )}

        {applications.map((app) => (

          <div
            key={app.id}
            style={{
              border: "1px solid #ddd",
              padding: "20px",
              marginBottom: "15px",
              borderRadius: "10px"
            }}
          >

            <p>
              Applied for: <strong>{app.jobTitle}</strong>
            </p>

            <p>
              👤 <strong>{app.users?.full_name || "Unknown Worker"}</strong>
            </p>

            <p>
              🛠 {app.users?.skills || "No skills listed"}
            </p>

            <p style={{ fontWeight: "500" }}>
              ⭐ {app.avgRating || 0} / 5 ({app.ratingCount || 0})
            </p>

            <p>Status: {app.status}</p>

            <div style={{ marginTop: "10px" }}>

              {app.status === "pending" && (
                <>
                  <button
                    onClick={() => approveWorker(app)}
                    style={{
                      marginRight: "10px",
                      padding: "8px 15px",
                      background: "#16a34a",
                      color: "white",
                      border: "none",
                      borderRadius: "6px"
                    }}
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => rejectWorker(app.id, app.worker_id)}
                    style={{
                      padding: "8px 15px",
                      background: "#dc2626",
                      color: "white",
                      border: "none",
                      borderRadius: "6px"
                    }}
                  >
                    Reject
                  </button>
                </>
              )}

              {app.status === "approved" && (
                <button
                  onClick={() => navigate(`/chat/${app.worker_id}`)}
                  style={{
                    padding: "8px 15px",
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "6px"
                  }}
                >
                  Message Worker
                </button>
              )}

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}

export default ContractorApplications