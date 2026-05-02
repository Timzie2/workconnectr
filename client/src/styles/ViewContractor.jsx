import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import supabase from "../supabaseClient"
import "../styles/ContractorProfile.css"

function ViewContractor() {

  const { id } = useParams()

  const [profile, setProfile] = useState(null)
  const [jobs, setJobs] = useState([])

  useEffect(() => {

    const loadData = async () => {

      // 🔥 GET COMPANY PROFILE
      const { data: userData } = await supabase
        .from("users")
        .select("company_name, location, about_company, avatar_url")
        .eq("id", id)
        .single()

      setProfile(userData)

      // 🔥 GET THEIR JOBS
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("*")
        .eq("contractor_id", id)
        .eq("status", "open")

      setJobs(jobsData || [])
    }

    loadData()

  }, [id])

  if (!profile) return null

  return (
    <div className="profile-page">

      <div className="profile-card">

        {/* HEADER */}
        <div className="profile-header">

          <div className="company-avatar">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="logo" />
              : "🏢"}
          </div>

          <div>
            <h2>{profile.company_name}</h2>
            <p>📍 {profile.location}</p>
          </div>

        </div>

        {/* ABOUT */}
        <div className="profile-section">
          <h3>About</h3>
          <p>{profile.about_company || "No description yet"}</p>
        </div>

        {/* JOBS */}
        <div className="profile-section">
          <h3>Open Jobs</h3>

          {jobs.length === 0 ? (
            <p>No jobs available</p>
          ) : (
            jobs.map(job => (
              <div key={job.id} className="review-card">
                <p className="review-name">{job.title}</p>
                <p className="review-text">{job.description}</p>
              </div>
            ))
          )}

        </div>

      </div>

    </div>
  )
}

export default ViewContractor