import "../styles/PostJob.css"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import { useAuth } from "../context/AuthContext"
import ContractorNavbar from "../components/ContractorNavbar"
import toast from "react-hot-toast" // ✅ ADD THIS
import "../styles/layout.css"
import "../styles/components.css"
import "../styles/Postjob.css"

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

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login")
    }
  }, [user, authLoading, navigate])

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
        ? "🔥 Urgent job posted!"
        : "Job posted successfully 🚀"
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
      toast.error("Payment cancelled")
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
      <ContractorNavbar />

      <div className="post-job-container">

        <div className="post-job-card">

          {/* 🔙 BACK BUTTON */}
          <button
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            ⬅ Back
          </button>

          <h1>Post a Job</h1>

          <form onSubmit={handlePostJob} className="post-job-form">

            {/* TITLE */}
            <div className="input-group">
              <span>📝</span>
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
  <span>📍</span>
  <input
    placeholder="Location"
    value={location}
    onChange={(e)=>setLocation(e.target.value)}
  />
</div>

{/* SALARY + PAY TYPE */}
<div className="input-group salary-group">
  <span>💰</span>

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

  <select
    value={payType}
    onChange={(e) => setPayType(e.target.value)}
    className="select-input"
  >
    <option value="daily">Per Day</option>
    <option value="hourly">Per Hour</option>
    <option value="weekly">Per Week</option>
    <option value="monthly">Per Month</option>
    <option value="fixed">Fixed Price</option>
  </select>
</div>

            {/* CATEGORY DROPDOWN */}
            <select
  value={category}
  onChange={(e)=>setCategory(e.target.value)}
  className="select-input"
>
  <option value="">Select Category</option>
  <option value="Construction">Construction</option>
  <option value="Electrical">Electrical</option>
  <option value="Cleaning">Cleaning</option>
  <option value="IT">IT</option>
  <option value="Accounting">Accounting</option>
  <option value="Design">Design</option>
  <option value="Marketing">Marketing</option>
  <option value="Other">Other</option> {/* ✅ NEW */}
</select>

{category === "Other" && (
  <div className="input-group">
    <span>✏️</span>
    <input
      placeholder="Enter your category (e.g. Cybersecurity)"
      value={customCategory}
      onChange={(e)=>setCustomCategory(e.target.value)}
      required
    />
  </div>
)}

<div className="checkbox-row">
  <input
    type="checkbox"
    checked={isUrgent}
    onChange={(e) => setIsUrgent(e.target.checked)}
  />
  <label>
  🚨 Mark as Urgent (₦300 — lasts 48hrs)
</label>
</div>

            <button type="submit" className="post-job-btn" disabled={loading}>
              {loading ? "⏳ Posting..." : "🚀 Post Job"}
            </button>

          </form>

        </div>

      </div>
    </>
  )
}

export default PostJob