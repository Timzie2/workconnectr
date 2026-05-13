import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import supabase from "../supabaseClient"
import ContractorNavbar from "../components/ContractorNavbar"
import "../styles/WorkerPublicProfile.css"

function WorkerPublicProfile() {

  const { id } = useParams()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [avgRating, setAvgRating] = useState(0)
  const [ratingCount, setRatingCount] = useState(0)

  useEffect(() => {
    if (id) {
      fetchProfile()
      fetchRatings()
    }
  }, [id])

  async function fetchProfile() {

    const { data, error } = await supabase
  .from("users")
  .select(`
    id,
    full_name,
    avatar_url,
    headline,
    location,
    skills,
    experience,
    phone
  `)
  .eq("id", id)
  .single()

    if (error) {
      console.error(error)
      return
    }

    setProfile(data)
    setLoading(false)
  }

  async function fetchRatings() {

    const { data } = await supabase
      .from("ratings")
      .select("rating")
      .eq("reviewed_id", id)

    if (data && data.length > 0) {

      const total = data.reduce(
        (sum, item) => sum + item.rating,
        0
      )

      setAvgRating((total / data.length).toFixed(1))
      setRatingCount(data.length)

    } else {

      setAvgRating(0)
      setRatingCount(0)
    }
  }

  if (loading) {
    return <div className="worker-public-loading">Loading...</div>
  }

  if (!profile) {
    return <div className="worker-public-loading">Worker not found</div>
  }

  return (
    <div>

      <ContractorNavbar />

      <div className="worker-public-container">

        <button
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          ⬅ Back
        </button>

        <div className="worker-public-card">

          <div className="worker-public-header">

            <img
              src={
                profile.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  profile.full_name || "Worker"
                )}&background=0f172a&color=fff`
              }
              alt="worker"
              className="worker-public-avatar"
            />

            <div>

              <h1>
                {profile.full_name || "Unnamed Worker"}
              </h1>

              <p className="worker-public-headline">
                {profile.headline || "Professional Worker"}
              </p>

              <div className="worker-public-rating">
                ⭐ {avgRating} / 5 ({ratingCount} reviews)
              </div>

            </div>

          </div>

          <div className="worker-public-section">

            <h3>📍 Location</h3>

            <p>
              {profile.location || "No location added"}
            </p>

          </div>

          <div className="worker-public-section">

            <h3>🛠 Skills</h3>

            <p>
              {profile.skills || "No skills added"}
            </p>

          </div>

          <div className="worker-public-section">

            <h3>💼 Experience</h3>

            <p>
              {profile.experience || "No experience added"}
            </p>

          </div>

          <div className="worker-public-section">

            <h3>📞 Contact</h3>

            <p>
              {profile.phone || "No phone number"}
            </p>

          </div>

        </div>

      </div>

    </div>
  )
}

export default WorkerPublicProfile