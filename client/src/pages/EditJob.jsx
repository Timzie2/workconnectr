import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import AppNavbar from "../components/AppNavbar"
import "../styles/edit-job.css"
import CustomSelect from "../components/CustomSelect"
import {
  FiSave
} from "react-icons/fi"

function EditJob() {

  const { id } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [salary, setSalary] = useState("")
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState("")
  const [payType, setPayType] = useState("daily")
  const [categories, setCategories] = useState([])

  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)

  // 🔥 NEW: UNSAVED CHANGES
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
  checkAccessAndFetch()
  fetchCategories()
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
setPayType(job.pay_type || "daily")

    setLoading(false)
  }

  async function fetchCategories() {

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("name")

  if (error) {
    console.error(error)
    return
  }

  setCategories(data || [])

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
  custom_category: null,
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
        <AppNavbar />
        <div className="edit-job-wrapper">
          <p>Loading job...</p>
        </div>
      </>
    )
  }

  const payTypeOptions = [
  { id: 1, name: "Per Day" },
  { id: 2, name: "Per Hour" },
  { id: 3, name: "Per Week" },
  { id: 4, name: "Per Month" },
  { id: 5, name: "Fixed Price" }
]

  return (
    <>
      <AppNavbar />

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

            {/* Salary + Pay Type */}

<div className="salary-row">

  <input
    type="number"
    value={salary}
    onChange={(e) => {
      setSalary(e.target.value)
      setIsDirty(true)
    }}
    placeholder="Salary (₦)"
  />

 <div className="pay-type-wrapper">
  <CustomSelect
  options={payTypeOptions}
  value={
    payType === "daily"
      ? "Per Day"
      : payType === "hourly"
      ? "Per Hour"
      : payType === "weekly"
      ? "Per Week"
      : payType === "monthly"
      ? "Per Month"
      : "Fixed Price"
  }
  placeholder="Pay Type"

  showIcons={false}
  allowRequest={false}

  onChange={(value) => {
    const map = {
      "Per Day": "daily",
      "Per Hour": "hourly",
      "Per Week": "weekly",
      "Per Month": "monthly",
      "Fixed Price": "fixed"
    }

    setPayType(map[value])
    setIsDirty(true)
  }}
/>
</div>

</div>

{/* Category */}

<div className="category-wrapper">
  <CustomSelect
  options={categories}
  value={category}
  placeholder="Select Category"

  showIcons={true}
  allowRequest={true}

  onChange={(value) => {
    setCategory(value)
    setIsDirty(true)
  }}
/>
</div>

            <div className="form-actions">

              <button
                type="submit"
                className="save-btn"
                disabled={saving}
              >
                <>
  <FiSave />
  Save Changes
</>
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