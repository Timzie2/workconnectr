import "../styles/PostJob.css"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import supabase from "../supabaseClient"
import { useAuth } from "../context/AuthContext"
import AppNavbar from "../components/AppNavbar"
import toast from "react-hot-toast" // ✅ ADD THIS
import "../styles/layout.css"
import "../styles/components.css"
import "../styles/PostJob.css"
import CustomSelect from "../components/CustomSelect"
import RequestCategoryModal from "../components/RequestCategoryModal"
import {
  FiArrowLeft,
  FiFileText,
  FiMapPin,
  FiDollarSign,
  FiEdit,
  FiAlertCircle
} from "react-icons/fi"

function PostJob() {

  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [salary, setSalary] = useState("")
  const [category, setCategory] = useState("")
  const [customCategory, setCustomCategory] = useState("")
  const [payType, setPayType] = useState("daily")
  const [isUrgent, setIsUrgent] = useState(false)
  const [categories, setCategories] = useState([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const routerLocation = useLocation()

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login")
    }
  }, [user, authLoading, navigate])

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

useEffect(() => {
  fetchCategories()
}, [])

useEffect(() => {

  if (routerLocation.state?.categoryApproved) {
    toast.success(
      "Your requested category has been approved! You can now select it."
    )
  }

  if (routerLocation.state?.categoryRejected) {
    toast.error(
      "Your category request wasn't approved. Please choose an existing category or submit a different request."
    )
  }

}, [routerLocation])

  const handlePostJob = (e) => {
  e.preventDefault()

  if (loading) {
  toast.error("Please wait...")
  return
}

  if (!user) {
    toast.error("You must be logged in")
    return
  }

  if (!title.trim() || !description.trim()) {
  toast.error("Title and description are required")
  return
}

if (!salary || Number(salary) <= 0) {
  toast.error("Enter a valid salary")
  return
}

  // ✅ ADD HERE
  if (!category) {
    toast.error("Please select a category")
    return
  }

  if (category === "Other" && !customCategory) {
    toast.error("Please enter custom category")
    return
  }

  // 🔥 IF URGENT → PAY FIRST
  if (isUrgent) {
    payForUrgent()
    return
  }

  insertJob(false)
}

const insertJob = async (urgent = false) => {
  setLoading(true)

  try {
    const { error } = await supabase
      .from("jobs")
      .insert([
  {
    title,
    description,
    location,
    salary: salary ? Number(salary) : null,
    pay_type: payType,
    category,
    custom_category: category === "Other" ? customCategory : null,
    contractor_id: user.id,

    status: "open",

    expires_at: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString(), // ✅ ADD THIS

    is_urgent: urgent,
    urgent_expires_at: urgent
      ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      : null,

    created_at: new Date().toISOString()
  }
])

    if (error) throw error

    toast.success(
  urgent
    ? "Urgent job posted successfully."
    : "Job posted successfully."
)

    setTitle("")
setDescription("")
setLocation("")
setSalary("")
setCategory("")
setCustomCategory("")
setPayType("daily")
setIsUrgent(false)

    navigate("/contractor-dashboard")

  } catch (err) {
    console.error(err)
    toast.error(err.message)
  } finally {
    setLoading(false)
  }
}

const payForUrgent = () => {
  if (!window.PaystackPop) {
    toast.error("Payment system not loaded")
    return
  }

  const handler = window.PaystackPop.setup({
    key: "pk_test_381c898e5ce344e689d30c21daf0397d3b9cf9dd",
    email: user?.email || "test@email.com",
    amount: 300 * 100,

    callback: function () {
      insertJob(true)
    },

    onClose: function () {
      toast.error("Payment was cancelled.")
    }
  })

  handler.openIframe()
}

  if (authLoading) {
    return <div className="dashboard-container">Loading...</div>
  }

  if (!user) return null

  return (
    <>
      <AppNavbar />

      <div className="post-job-container">

        <div className="post-job-card">

          {/* 🔙 BACK BUTTON */}
          <button
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            <FiArrowLeft />
Back
          </button>

          <h1>Post a Job</h1>

          <form onSubmit={handlePostJob} className="post-job-form">

            {/* TITLE */}
            <div className="input-group">
              <span><FiFileText /></span>
              <input
                placeholder="Job Title"
                value={title}
                onChange={(e)=>setTitle(e.target.value)}
                required
              />
            </div>

            {/* DESCRIPTION */}
            <textarea
              placeholder="Job Description"
              value={description}
              onChange={(e)=>setDescription(e.target.value)}
              required
            />

            {/* LOCATION */}
<div className="input-group">
  <span><FiMapPin /></span>
  <input
    placeholder="Location"
    value={location}
    onChange={(e)=>setLocation(e.target.value)}
  />
</div>

{/* Salary + Pay Type */}
<div className="salary-row">

  <div className="input-group salary-input">

    <span><FiDollarSign /></span>

    <input
      type="number"
      placeholder="Enter amount (₦)"
      value={salary}
      onChange={(e) => {
        const value = e.target.value.replace(/[^0-9]/g, "")
        setSalary(value)
      }}
      min="0"
    />

  </div>

  <select
    className="select-input pay-type-select"
    value={payType}
    onChange={(e) => setPayType(e.target.value)}
  >
    <option value="daily">Per Day</option>
    <option value="hourly">Per Hour</option>
    <option value="weekly">Per Week</option>
    <option value="monthly">Per Month</option>
    <option value="fixed">Fixed Price</option>
  </select>

</div>

{/* Category */}
<CustomSelect
  options={categories}
  value={category}
  placeholder="Select Category"
  showRequestOption={true}
  onChange={(value) => {

    if (value === "__request__") {
      setShowCategoryModal(true)
      return
    }

    setCategory(value)

  }}
/>

<div className="urgent-row">

  <label>
    <input
      type="checkbox"
      checked={isUrgent}
      onChange={(e) => setIsUrgent(e.target.checked)}
    />

    <FiAlertCircle />
Mark as Urgent (₦300 • 48 hours)
  </label>

</div>

            <button type="submit" className="post-job-btn" disabled={loading}>
              {loading ? "Posting..." : "Post Job"}
            </button>

          </form>

        </div>

      </div>
      <RequestCategoryModal
  isOpen={showCategoryModal}
  onClose={() => setShowCategoryModal(false)}
/>
    </>
  )
}

export default PostJob