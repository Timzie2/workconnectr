import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import supabase from "../supabaseClient"
import WorkerNavbar from "../components/WorkerNavbar"
import "./ContractorProfile.css"

function ContractorPublicProfile({ darkMode, setDarkMode }) {

  const { id } = useParams()

  const [contractor, setContractor] = useState(null)
  const [reviews, setReviews] = useState([])
  const [avgRating, setAvgRating] = useState(0)

  useEffect(() => {
    fetchContractor()
    fetchReviews()
  }, [id])

  // ✅ FETCH CONTRACTOR
  async function fetchContractor() {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single()

    setContractor(data)
  }

  // ✅ FETCH REVIEWS
  async function fetchReviews() {
    const { data } = await supabase
      .from("ratings")
      .select(`
        rating,
        reviewer_id,
        users:reviewer_id(full_name)
      `)
      .eq("reviewed_id", id)

    setReviews(data || [])

    if (data && data.length > 0) {
      const sum = data.reduce((acc, r) => acc + r.rating, 0)
      setAvgRating((sum / data.length).toFixed(1))
    }
  }

  if (!contractor) return <div>Loading...</div>

  return (
    <>
      <WorkerNavbar darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="contractor-profile">

        {/* 🔥 HEADER */}
        <div className="profile-header">

          <div className="profile-avatar">
            {contractor.full_name?.charAt(0)}
          </div>

          <div>
            <h2>{contractor.full_name}</h2>

            <p className="profile-role">
              {contractor.role}
            </p>

            {/* ⭐ RATING */}
            <div className="profile-rating">
              ⭐ {avgRating || "New"} ({reviews.length} reviews)
            </div>

            {/* ✅ VERIFIED */}
            {reviews.length >= 3 && (
              <span className="verified-badge">
                ✔ Verified Contractor
              </span>
            )}

          </div>

        </div>

        {/* 📝 ABOUT */}
        <div className="profile-section">
          <h3>About</h3>
          <p>{contractor.bio || "No description provided"}</p>
        </div>

        {/* ⭐ REVIEWS */}
        <div className="profile-section">

          <h3>Reviews</h3>

          {reviews.length === 0 ? (
            <p>No reviews yet</p>
          ) : (
            reviews.map((r, index) => (
              <div key={index} className="review-card">

                <p className="review-name">
                  {r.users?.full_name}
                </p>

                <p className="review-rating">
                  ⭐ {r.rating}
                </p>

              </div>
            ))
          )}

        </div>

      </div>
    </>
  )
}

export default ContractorPublicProfile