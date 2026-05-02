import { useState } from "react"
import supabase from "../supabaseClient"
import toast from "react-hot-toast"

function RatingModal({ job, user, onClose }) {

  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [review, setReview] = useState("")
  const [loading, setLoading] = useState(false)

  const submitRating = async () => {

    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }

    setLoading(true)

    try {

      // ✅ PREVENT DUPLICATE REVIEWS
      const { data: existing } = await supabase
        .from("ratings")
        .select("id")
        .eq("reviewer_id", user.id)
        .eq("job_id", job.id)
        .maybeSingle()

      if (existing) {
        toast.error("You already reviewed this job")
        setLoading(false)
        return
      }

      // ✅ INSERT REVIEW
      const { error } = await supabase
        .from("ratings")
        .insert([
          {
            reviewer_id: user.id,
            reviewed_id: job.contractor_id,
            job_id: job.id,
            rating: rating,
            review: review   // 🔥 FIXED COLUMN NAME
          }
        ])

      if (error) throw error

      toast.success("⭐ Review submitted successfully!")

      // ✅ RESET + CLOSE
      setRating(0)
      setReview("")
      onClose()

    } catch (err) {
      console.error(err)
      toast.error("Error submitting review")
    }

    setLoading(false)
  }

  return (

    <div className="modal-overlay">

      <div className="modal">

        <h2>Rate this contractor</h2>

        {/* ⭐ STARS */}
        <div className="stars">

          {[1,2,3,4,5].map((star) => (
            <span
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              style={{
                color: star <= (hover || rating) ? "#facc15" : "#475569",
                fontSize: "28px",
                cursor: "pointer",
                transition: "0.2s"
              }}
            >
              ★
            </span>
          ))}

        </div>

        {/* ⭐ TEXT FEEDBACK */}
        <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "5px" }}>
          {rating === 0 && "Select rating"}
          {rating === 1 && "Poor"}
          {rating === 2 && "Fair"}
          {rating === 3 && "Good"}
          {rating === 4 && "Very Good"}
          {rating === 5 && "Excellent"}
        </p>

        {/* 💬 REVIEW */}
        <textarea
          placeholder="Write your experience..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
          style={{
            width: "100%",
            marginTop: "15px",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #334155",
            background: "#0f172a",
            color: "white",
            minHeight: "80px"
          }}
        />

        {/* BUTTONS */}
        <div className="modal-actions">

          <button onClick={onClose}>
            Cancel
          </button>

          <button
            onClick={submitRating}
            disabled={loading}
            style={{
              background: "#22c55e",
              color: "white",
              border: "none",
              padding: "8px 14px",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>

        </div>

      </div>

    </div>
  )
}

export default RatingModal