import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import supabase from "../supabaseClient"
import WorkerNavbar from "../components/WorkerNavbar"
import StarRating from "../components/StarRating"
import "../styles/ContractorPublicProfile.css"

function ContractorPublicProfile() {

  const { id } = useParams()

  const [contractor, setContractor] = useState(null)
  const [reviews, setReviews] = useState([])
  const [avgRating, setAvgRating] = useState("New")
  const [ratings, setRatings] = useState([])

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

  // ✅ FETCH REVIEWS (UPDATED 🔥)
  async function fetchReviews() {

      const { data, error } = await supabase
  .from("ratings")
  .select(`
    rating,
    comment,
    created_at,
    reviewer:reviewer_id(full_name)
  `)
  .eq("contractor_id", id)
  .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      return
    }

    setReviews(data || [])

    if (data && data.length > 0) {
      const sum = data.reduce((acc, r) => acc + r.rating, 0)
      setAvgRating((sum / data.length).toFixed(1))
    } else {
      setAvgRating("New")
    }
  }

  if (!contractor) return <div>Loading...</div>

  return (
    <>
      <WorkerNavbar />

      <div className="contractor-profile">

        {/* 🔥 HEADER */}
<div className="profile-header">

  {/* LEFT */}
  <div className="profile-left">

    {contractor.avatar_url ? (

      <img
        src={contractor.avatar_url}
        alt="contractor"
        className="contractor-avatar"
      />

    ) : (

      <div className="profile-avatar">
        {contractor.company_name?.charAt(0) ||
         contractor.full_name?.charAt(0)}
      </div>

    )}

  </div>

  {/* RIGHT */}
  <div className="profile-right">

    <h1>
      {contractor.company_name || contractor.full_name}
    </h1>

    <p className="profile-role">
      {contractor.role}
    </p>

    {/* ⭐ RATING */}
    <div className="profile-rating">

      {avgRating === "New" ? (

        <span style={{ color:"#94a3b8" }}>
          ⭐ No ratings yet
        </span>

      ) : (

        <>
          <StarRating rating={parseFloat(avgRating)} />

          <span
            style={{
              marginLeft:"8px",
              fontSize:"14px"
            }}
          >
            {avgRating} ({reviews.length} reviews)
          </span>
        </>

      )}

    </div>

    {/* VERIFIED */}
    {reviews.length >= 3 && (
      <span className="verified-badge">
        ✔ Verified Contractor
      </span>
    )}

    {/* EXTRA INFO */}
    <div className="contractor-meta">

      <span>
        📍 {contractor.location || "No location"}
      </span>

      <span>
        💼 Contractor
      </span>

    </div>

  </div>

</div>

        {/* 📝 ABOUT */}
        <div className="profile-section">
          <h3>About</h3>
          <p>
  {contractor.about_company ||
   "This contractor hasn’t added a description yet."}
</p>
        </div>

        {/* ⭐ REVIEWS (UPGRADED 💎) */}
        <div className="profile-section">

          <h3>Reviews</h3>

          {reviews.length === 0 ? (
            <p>No reviews yet — be the first to rate this contractor.</p>
          ) : (
            reviews.map((r, index) => (
              <div key={index} className="review-card">

                <div className="review-top">
                  <p className="review-name">
                    {r.reviewer?.full_name}
                  </p>

                  <StarRating rating={r.rating} />
                </div>

                {r.comment && (
  <p className="review-text">
    {r.comment}
  </p>
)}

                <p className="review-date">
                  {new Date(r.created_at).toLocaleDateString()}
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