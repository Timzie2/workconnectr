import { Star } from "lucide-react"

function StarRating({ rating = 0 }) {

  const fullStars = Math.floor(rating)
  const emptyStars = 5 - fullStars

  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={"full" + i} size={14} fill="#facc15" color="#facc15" />
      ))}

      {[...Array(emptyStars)].map((_, i) => (
        <Star key={"empty" + i} size={14} color="#94a3b8" />
      ))}
    </div>
  )
}

export default StarRating