import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import ContractorNavbar from "../components/ContractorNavbar"
import "../styles/edit-job.css"

function EditJob() {

  const { id } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [salary, setSalary] = useState("")
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState("")
const [customCategory, setCustomCategory] = useState("")
const [payType, setPayType] = useState("daily")

  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)

  // 🔥 NEW: UNSAVED CHANGES
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    checkAccessAndFetch()
  }, [])

  // 🔥 WARN BEFORE LEAVING PAGE
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [isDirty])

  const checkAccessAndFetch = async () => {

    const { data } = await supabase.auth.getSession()
    const user = data.session?.user

    if (!user) {
      navigate("/login")
      return
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "contractor") {
      navigate("/worker-dashboard")
      return
    }

    const { data: job, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !job) {
      alert("Job not found")
      navigate("/contractor-dashboard")
      return
    }

    if (job.contractor_id !== user.id) {
      alert("Unauthorized access")
      navigate("/contractor-dashboard")
      return
    }

    setTitle(job.title || "")
    setDescription(job.description || "")
    setLocation(job.location || "")
    setSalary(job.salary || "")
setCategory(job.category || "")
setCustomCategory(job.custom_category || "")
setPayType(job.pay_type || "daily")

    setLoading(false)
  }

  const updateJob = async (e) => {
    e.preventDefault()

    if (!title || !description || !location) {
      alert("Please fill all required fields")
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from("jobs")
      .update({
  title,
  description,
  location,
  salary: salary ? Number(salary) : null,
  category,
  custom_category: category === "Other" ? customCategory : null,
  pay_type: payType
})
      .eq("id", id)

    setSaving(false)

    if (error) {
      alert("Failed to update job")
      return
    }

    // ✅ RESET DIRTY STATE
    setIsDirty(false)

    setShowToast(true)

    setTimeout(() => {
      setShowToast(false)
      navigate("/contractor-dashboard")
    }, 2000)
  }

  if (loading) {
    return (
      <>
        <ContractorNavbar />
        <div className="edit-job-wrapper">
          <p>Loading job...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <ContractorNavbar />

      <div className="edit-job-wrapper">

        <div className="edit-job-card">

          <h2>Edit Job</h2>

          <form onSubmit={updateJob}>

            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setIsDirty(true)
              }}
              placeholder="Job Title"
              required
            />

            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setIsDirty(true)
              }}
              placeholder="Description"
              required
            />

            <input
              value={location}
              onChange={(e) => {
                setLocation(e.target.value)
                setIsDirty(true)
              }}
              placeholder="Location"
              required
            />

            <input
              type="number"
              value={salary}
              onChange={(e) => {
                setSalary(e.target.value)
                setIsDirty(true)
              }}
              placeholder="Salary (₦)"
            />

            {/* CATEGORY */}
<select
  value={category}
  onChange={(e) => {
    setCategory(e.target.value)
    setIsDirty(true)
  }}
>
  <option value="">Select Category</option>
  <option value="Construction">Construction</option>
  <option value="Electrical">Electrical</option>
  <option value="Cleaning">Cleaning</option>
  <option value="IT">IT</option>
  <option value="Accounting">Accounting</option>
  <option value="Design">Design</option>
  <option value="Marketing">Marketing</option>
  <option value="Other">Other</option>
</select>

{/* OTHER CATEGORY INPUT */}
{category === "Other" && (
  <input
    placeholder="Enter custom category"
    value={customCategory}
    onChange={(e) => {
      setCustomCategory(e.target.value)
      setIsDirty(true)
    }}
    required
  />
)}

{/* PAY TYPE */}
<select
  value={payType}
  onChange={(e) => {
    setPayType(e.target.value)
    setIsDirty(true)
  }}
>
  <option value="daily">Per Day</option>
  <option value="hourly">Per Hour</option>
  <option value="weekly">Per Week</option>
  <option value="monthly">Per Month</option>
  <option value="fixed">Fixed Price</option>
</select>

            <div className="form-actions">

              <button
                type="submit"
                className="save-btn"
                disabled={saving}
              >
                {saving ? <span className="spinner"></span> : "💾 Save Changes"}
              </button>

              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  if (isDirty) {
                    const confirmLeave = window.confirm(
                      "You have unsaved changes. Leave anyway?"
                    )
                    if (!confirmLeave) return
                  }
                  navigate("/contractor-dashboard")
                }}
              >
                Cancel
              </button>

            </div>

          </form>

        </div>

      </div>

      {showToast && (
        <div className="toast">
          ✅ Job updated successfully!
        </div>
      )}
    </>
  )
}

export default EditJob