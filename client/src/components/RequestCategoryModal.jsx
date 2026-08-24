import { useState } from "react"
import supabase from "../supabaseClient"
import { useAuth } from "../context/AuthContext"
import toast from "react-hot-toast"

function RequestCategoryModal({
  isOpen,
  onClose
}) {

  const { user } = useAuth()

  const [categoryName, setCategoryName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  async function submitRequest() {

    if (!categoryName.trim()) {
      toast.error("Enter a category name")
      return
    }

    setLoading(true)

    const { data, error } = await supabase
  .from("category_requests")
  .insert({
    user_id: user.id,
    category_name: categoryName,
    description,
    status: "pending"
  })
  .select()

console.log(data)
console.log(error)

    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(
      "🎉 Category request submitted!"
    )

    setCategoryName("")
    setDescription("")

    onClose()

  }

  return (

    <div className="modal-overlay">

      <div className="category-modal">

        <h2>
          ✨ Request New Category
        </h2>

        <p>
          Can't find your category?
          Tell us and we'll review it.
        </p>

        <input
          placeholder="Category Name"
          value={categoryName}
          onChange={(e)=>
            setCategoryName(e.target.value)
          }
        />

        <textarea
          placeholder="Why should this category be added?"
          value={description}
          onChange={(e)=>
            setDescription(e.target.value)
          }
        />

        <div className="modal-actions">

          <button
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            onClick={submitRequest}
            disabled={loading}
          >
            {loading
              ? "Submitting..."
              : "Submit Request"}
          </button>

        </div>

      </div>

    </div>

  )

}

export default RequestCategoryModal