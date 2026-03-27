import { useState } from "react"
import supabase from "../supabaseClient"

function RatingModal({ job, user, onClose }) {

  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)

  const submitRating = async () => {

    if (rating === 0) {
      alert("Please select a rating")
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from("ratings")
      .insert([
        {
          reviewer_id: user.id,
          reviewed_id: job.contractor_id,
          job_id: job.id,
          rating,
          comment
        }
      ])

    if (error) {
      alert("Error submitting rating")
      console.log(error)
    } else {
      alert("✅ Review submitted!")
      onClose()
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
              className="star"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              style={{
                color: star <= (hover || rating) ? "#facc15" : "#475569",
                fontSize: "28px",
                cursor: "pointer"
              }}
            >
              ★
            </span>
          ))}

        </div>

        {/* COMMENT */}
        <textarea
          placeholder="Write a review..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        {/* BUTTONS */}
        <div className="modal-actions">

          <button onClick={onClose}>
            Cancel
          </button>

          <button onClick={submitRating} disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>

        </div>

      </div>

    </div>
  )
}

export default RatingModal