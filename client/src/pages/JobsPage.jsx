import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import AppNavbar from "../components/AppNavbar"
import { useAuth } from "../context/AuthContext"
import "../styles/jobs.css"
import toast from "react-hot-toast"
import {
  FiSearch,
  FiMapPin,
  FiDollarSign,
  FiFilter,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi"


function JobsPage() {

  const navigate = useNavigate()

  const { user, loading: authLoading } = useAuth()

  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [tick, setTick] = useState(0)
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [salaryFilter, setSalaryFilter] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [categories, setCategories] = useState([])
  const categoryScrollRef = useRef(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  // ✅ REDIRECT SAFELY (NO FORCE RELOAD)
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login")
    }
  }, [user, authLoading, navigate])

  // ✅ FETCH DATA AFTER AUTH
  useEffect(() => {
    if (!authLoading && user) {
      fetchAll()
    }
  }, [user, authLoading])

  useEffect(() => {
  const channel = supabase
    .channel("jobs-live")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "jobs"
      },
      () => {
  fetchJobs()
  fetchCategories()
}
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])

useEffect(() => {
  const interval = setInterval(() => {
    setTick(prev => prev + 1)
  }, 1000)

  return () => clearInterval(interval)
}, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([
  fetchJobs(),
  fetchApplications(),
  fetchRatings(),
  fetchCategories()
])
    setLoading(false)
  }

  async function fetchRatings() {
  const { data, error } = await supabase
    .from("ratings")
    .select("contractor_id, rating")

  if (error) {
    console.error("Ratings error:", error.message)
    return
  }

  setRatings(data || [])
}

const scrollCategories = (direction) => {
  if (!categoryScrollRef.current) return

  categoryScrollRef.current.scrollBy({
    left: direction === "left" ? -300 : 300,
    behavior: "smooth"
  })
}

const checkScrollButtons = () => {
  const container = categoryScrollRef.current
  if (!container) return

  setShowLeftArrow(container.scrollLeft > 0)

  setShowRightArrow(
    container.scrollLeft <
      container.scrollWidth - container.clientWidth - 5
  )
}

useEffect(() => {
  checkScrollButtons()
}, [categories])

  // ✅ FETCH JOBS
  async function fetchJobs() {
  const { data, error } = await supabase
    .from("jobs")
    .select(`
      *,
      users!jobs_contractor_id_fkey (
        full_name,
        company_name,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Jobs error:", error.message)
    return
  }

  setJobs(data || [])
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

  // ✅ FETCH APPLICATIONS
  async function fetchApplications() {

    if (!user) return

    const { data, error } = await supabase
      .from("applications")
      .select("job_id, status, created_at")
      .eq("worker_id", user.id)

    if (error) {
      console.error("Applications error:", error.message)
      return
    }

    setApplications(data || [])
  }

  // ✅ APPLY JOB
  async function applyJob(jobId) {

  if (!user) return

  const alreadyApplied = applications.some(a => a.job_id === jobId)
  if (alreadyApplied) return

  const { error } = await supabase
    .from("applications")
    .insert({
      job_id: jobId,
      worker_id: user.id,
      status: "pending"
    })

  if (error) {
    console.error(error)
    toast.error("Failed to apply")
    return
  }

  const selectedJob = jobs.find(job => job.id === jobId)

const { data: workerProfile } = await supabase
  .from("users")
  .select("full_name, avatar_url")
  .eq("id", user.id)
  .single()

const { error: notificationError } = await supabase
  .from("notifications")
  .insert({
    user_id: selectedJob.contractor_id,
    sender_id: user.id,
    title: "New Application",
    message: `${workerProfile?.full_name || "A worker"} applied for ${selectedJob.title}`,
    type: "application",
    job_id: jobId,
    is_read: false
  })

console.log(notificationError)

  toast.success("Application sent 🚀")

  // ✅ update applications instead
  setApplications(prev => [
    ...prev,
    { job_id: jobId, status: "pending" }
  ])
}

  const withdrawApplication = async (jobId) => {
  const confirm = window.confirm("Withdraw application?")
  if (!confirm) return

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("job_id", jobId)
    .eq("worker_id", user.id)

  if (error) {
    toast.error("Failed to withdraw")
    return
  }

  toast.success("Application withdrawn")

  // ✅ update applications
  setApplications(prev => prev.filter(a => a.job_id !== jobId))
}

  // ✅ AUTH LOADING
  if (authLoading) {
    return (
      <>
        <AppNavbar />
        <div className="worker-dashboard">Loading...</div>
      </>
    )
  }

  // ✅ BLOCK RENDER UNTIL REDIRECT
  if (!user) return null

  // ✅ PAGE LOADING
  if (loading) {
    return (
      <>
        <AppNavbar />
        <div className="worker-dashboard">Loading jobs...</div>
      </>
    )
  }

  const sortedJobs = [...jobs].sort((a, b) => {

  // 🔴 CLOSED LAST
  if (a.status === "closed" && b.status !== "closed") return 1
  if (a.status !== "closed" && b.status === "closed") return -1

  // 🚨 URGENT FIRST
  if (a.is_urgent && !b.is_urgent) return -1
  if (!a.is_urgent && b.is_urgent) return 1

  // 💎 FEATURED NEXT
  if (a.is_featured && !b.is_featured) return -1
  if (!a.is_featured && b.is_featured) return 1

  // 🆕 NEWEST LAST
  return new Date(b.created_at) - new Date(a.created_at)
})



const now = new Date()

const activeJobs = sortedJobs.filter(job => {
  const isExpired = job.expires_at
    ? new Date(job.expires_at) < now
    : false

  return job.status !== "closed" && !isExpired
})

const filteredJobs = activeJobs
  .filter(job => {

    const matchesSearch =

  (job.title || "")
    .toLowerCase()
    .includes(search.toLowerCase()) ||

  (job.description || "")
    .toLowerCase()
    .includes(search.toLowerCase()) ||

  (job.location || "")
    .toLowerCase()
    .includes(search.toLowerCase()) ||

  (job.users?.company_name || "")
    .toLowerCase()
    .includes(search.toLowerCase())

    const matchesLocation =
  locationFilter === "" ||

  (job.location || "")
    .toLowerCase()
    .includes(locationFilter.toLowerCase())

    const matchesSalary =
      salaryFilter === "" ||

      Number(job.salary) >= Number(salaryFilter)

    const matchesCategory =
  categoryFilter === "" ||
  (job.category || "")
    .trim()
    .toLowerCase() ===
  categoryFilter
    .trim()
    .toLowerCase()

    return (
  matchesSearch &&
  matchesLocation &&
  matchesSalary &&
  matchesCategory
)

  })

  if (sortBy === "salary-high") {

  filteredJobs.sort(
    (a, b) => Number(b.salary) - Number(a.salary)
  )

}

if (sortBy === "salary-low") {

  filteredJobs.sort(
    (a, b) => Number(a.salary) - Number(b.salary)
  )

}

if (sortBy === "newest") {

  filteredJobs.sort(
    (a, b) =>
      new Date(b.created_at) -
      new Date(a.created_at)
  )

}

const recentlyClosedJobs = sortedJobs.filter(job => {
  const isExpired = job.expires_at
  ? new Date(job.expires_at) < new Date()
  : false

if (job.status !== "closed" && !isExpired) return false
  const now = Date.now()

const closedTime = new Date(
  job.updated_at ?? job.created_at ?? Date.now()
).getTime()

const hours = (now - closedTime) / (1000 * 60 * 60)
  return hours <= 48 // 🔥 last 48 hours
})

const getClosedTimeText = (date) => {
  if (!date) return ""

  const now = Date.now()
  const closed = new Date(date).getTime()

  const diff = now - closed

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 10) return "Closed just now"
if (seconds < 60) return `Closed ${seconds}s ago`
  if (minutes < 60) return `Closed ${minutes} min ago`
  if (hours === 1) return "Closed 1 hour ago"
  if (hours < 24) return `Closed ${hours} hours ago`

  const days = Math.floor(hours / 24)
  return `Closed ${days} day(s) ago`
}

const getAppliedTimeText = (date) => {
  if (!date) return ""

  const now = Date.now()
  const applied = new Date(date).getTime()
  const diff = now - applied

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return "Just applied"
  if (minutes < 60) return `${minutes} min ago`
  if (hours === 1) return "1 hour ago"
  if (hours < 24) return `${hours} hours ago`
  return `${days} day(s) ago`
}

tick

  return (
    <>
      <AppNavbar />

      <div className="jobs-page">

        <h1>Available Jobs</h1>

        <div className="jobs-filter-bar">

  <div className="filter-input">

    <FiSearch className="filter-icon" />

    <input
      type="text"
      placeholder="Search jobs, companies or skills..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />

  </div>

  <div className="filter-input">

    <FiMapPin className="filter-icon" />

    <input
      type="text"
      placeholder="Location"
      value={locationFilter}
      onChange={(e) => setLocationFilter(e.target.value)}
    />

  </div>

  <div className="filter-select">

    <FiDollarSign className="filter-icon" />

    <select
      value={salaryFilter}
      onChange={(e) => setSalaryFilter(e.target.value)}
    >
      <option value="">Any Salary</option>
      <option value="50000">₦50k+</option>
      <option value="100000">₦100k+</option>
      <option value="250000">₦250k+</option>
      <option value="500000">₦500k+</option>
    </select>

  </div>

  <div className="filter-select">

    <FiFilter className="filter-icon" />

    <select
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value)}
    >
      <option value="newest">Newest</option>
      <option value="salary-high">
        Highest Salary
      </option>
      <option value="salary-low">
        Lowest Salary
      </option>
    </select>

  </div>

</div>

<div className="category-wrapper">

  {/* ◀ LEFT */}
{showLeftArrow && (
  <button
    className="category-arrow"
    onClick={() => scrollCategories("left")}
  >
    <FiChevronLeft />
  </button>
)}

  {/* CATEGORY CHIPS */}
  <div
  className="category-filter"
  ref={categoryScrollRef}
  onScroll={checkScrollButtons}
>

    <button
      className={categoryFilter === "" ? "active" : ""}
      onClick={() => setCategoryFilter("")}
    >
      🌍 All
    </button>

    {categories.map((category) => (

      <button
        key={category.id}
        className={
          categoryFilter === category.name
            ? "active"
            : ""
        }
        onClick={() => setCategoryFilter(category.name)}
      >
        <span style={{ color: category.color }}>
          {category.icon}
        </span>{" "}
        {category.name}
      </button>

    ))}

  </div>

  {/* ▶ RIGHT */}
{showRightArrow && (
  <button
    className="category-arrow"
    onClick={() => scrollCategories("right")}
  >
    <FiChevronRight />
  </button>
)}

</div>

        {jobs.length === 0 && (
          <p style={{ opacity: 0.7 }}>No jobs available yet</p>
        )}

        <div className="jobs-grid">

          {filteredJobs.map((job) => {

            const contractorRatings = ratings.filter(
  r => r.contractor_id === job.contractor_id
)

const avgRating =
  contractorRatings.length > 0
    ? (
        contractorRatings.reduce((sum, r) => sum + r.rating, 0) /
        contractorRatings.length
      ).toFixed(1)
    : null

  const application = applications.find(a => a.job_id === job.id)
  const alreadyApplied = !!application
  const status = application?.status
  const appliedTime = application?.created_at

  return (
    <div
      className={`job-card ${job.status === "closed" ? "closed" : ""}`}
      key={job.id}
      onClick={() => navigate(`/job/${job.id}`)}
    >


  <div className="job-badges">

  {job.is_featured && (
    <span className="featured-badge">⭐ Featured</span>
  )}


  {job.is_urgent && (
    <span className="urgent-badge">🚨 Urgent</span>
  )}

</div>

  {/* 🔥 TOP: COMPANY */}
  <div className="company-row jobs-company-row">
    <img
      src={
        job.users?.avatar_url
          ? job.users.avatar_url
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
              job.users?.company_name || job.users?.full_name || "User"
            )}&background=0D8ABC&color=fff`
      }
      alt="logo"
      className="company-logo"
      onClick={(e) => {
        e.stopPropagation()
        navigate(`/contractor/${job.contractor_id}`)
      }}
    />

    <div>
      <p
  className="company-name"
  onClick={(e) => {
    e.stopPropagation()
    navigate(`/contractor/${job.contractor_id}`)
  }}
>
  {job.users?.company_name || job.users?.full_name || "Anonymous"}

  {avgRating && (
    <span className="rating-inline">
      ⭐ {avgRating}
    </span>
  )}
</p>

      {(() => {
  const now = new Date()
  const isExpired = job.expires_at
    ? new Date(job.expires_at) < now
    : false

  if (isExpired) {
    return <span className="closed-badge">⚠️ Expired</span>
  }

  if (job.status === "closed") {
    return <span className="closed-badge">🔒 Closed</span>
  }

  return <span className="hiring-badge">🔥 Hiring Now</span>
})()}

    </div>

    {job.expires_at && new Date(job.expires_at) < new Date() && (
  <p style={{ color: "#f59e0b", fontSize: "12px", marginTop: "4px" }}>
    ⚠️ This job expired
  </p>
)}

  </div>

  {/* 🔥 JOB TITLE */}
  <h3 className="job-title">{job.title}</h3>

  {/* 🔥 DESCRIPTION */}
  <p className="job-desc">
    {job.description?.slice(0, 90)}...
  </p>

  {/* 🔥 INFO ROW */}
  <div className="job-footer">

    <span className="job-location">📍 {job.location}</span>

    <span className="job-salary">
  💰 ₦{Number(job.salary || 0).toLocaleString()}{" "}
  {job.pay_type === "fixed"
    ? "(fixed)"
    : job.pay_type === "daily"
    ? "per day"
    : job.pay_type === "weekly"
    ? "per week"
    : job.pay_type === "monthly"
    ? "per month"
    : ""}
</span>

  </div>

  {/* 🔥 APPLY BUTTON */}
 <div className="job-actions">

  {/* 👁 VIEW BUTTON */}
  <button
    className="view-btn"
    onClick={(e) => {
      e.stopPropagation()
      navigate(`/job/${job.id}`)
    }}
  >
     View
  </button>

  {/* APPLY / WITHDRAW / STATUS */}
  {alreadyApplied ? (
    <button
      className={`apply-btn applied ${status}`}
      onClick={(e) => {
        e.stopPropagation()
        withdrawApplication(job.id)
      }}
    >
      {status === "pending" && "⏳ Pending"}
      {status === "approved" && "✅ approved"}
      {status === "rejected" && "❌ Rejected"}
      {" (Withdraw)"}
    </button>
  ) : (
    <button
      className="apply-btn"
      onClick={(e) => {
        e.stopPropagation()
        applyJob(job.id)
      }}
      disabled={
        job.status === "closed" ||
        (job.expires_at && new Date(job.expires_at) < new Date())
      }
    >
      {job.expires_at && new Date(job.expires_at) < new Date()
        ? "Expired"
        : job.status === "closed"
        ? "Closed"
        : "Apply Now"}
    </button>
  )}

</div>

{alreadyApplied && (
  <small style={{ opacity: 0.7, display: "block", marginTop: "5px" }}>
    Applied {getAppliedTimeText(appliedTime)}
  </small>
)}

</div>

          )
})}

        </div>

        {recentlyClosedJobs.length > 0 && (
  <>
    <h2 style={{ marginTop: "30px", opacity: 0.8 }}>
      Recently Closed Jobs
    </h2>

    <div className="jobs-grid">
      {recentlyClosedJobs.map((job) => (

        <div
  key={job.id}
  className="job-card closed"
>

  {/* 🔴 CLOSED TIME */}
  <div className="closed-overlay">
    🔒 {getClosedTimeText(job.updated_at || job.created_at)}
  </div>

  {/* 🔥 COMPANY (adds structure like active cards) */}
  <div className="company-row">
    <img
      src={
        job.users?.avatar_url
          ? job.users.avatar_url
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
              job.users?.company_name || job.users?.full_name || "User"
            )}&background=0D8ABC&color=fff`
      }
      alt="logo"
      className="company-logo"
    />

    <div>
      <p className="company-name">
        {job.users?.company_name || job.users?.full_name || "Anonymous"}
      </p>
      <span className="closed-badge">🔒 Closed</span>
    </div>
  </div>

  {/* 🔥 TITLE */}
  <h3 className="job-title">{job.title}</h3>

  {/* 🔥 DESCRIPTION */}
  <p className="job-desc">
    {job.description?.slice(0, 90)}...
  </p>

  {/* 🔥 FOOTER */}
  <div className="job-footer">
    <span>📍 {job.location}</span>
    <span>
      💰 ₦{Number(job.salary || 0).toLocaleString()}
    </span>
  </div>

</div>

      ))}
    </div>
  </>
)}

      </div>
    </>
  )
}

export default JobsPage