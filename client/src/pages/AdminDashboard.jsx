import { useEffect, useState } from "react"
import supabase from "../supabaseClient"
import AdminSidebar from "../components/AdminSidebar"
import "../styles/AdminDashboard.css"
import "../styles/Admin.css"
import AdminCharts from "../components/AdminCharts"
import { useNavigate } from "react-router-dom"

function AdminDashboard() {

  const [stats, setStats] = useState({
  users: 0,
  workers: 0,
  contractors: 0,
  jobs: 0,
  activeJobs: 0,
  applications: 0,
  reviews: 0,
  revenue: 0,
  categories: 0,
  requests: 0,
  admins: 0,
  suspended: 0
})

const [recentUsers, setRecentUsers] = useState([])
const [recentJobs, setRecentJobs] = useState([])
const [recentPayments, setRecentPayments] = useState([])
const [chartData, setChartData] = useState([])
const navigate = useNavigate()

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {

   const [
  users,
  workers,
  contractors,
  jobs,
  activeJobs,
  applications,
  reviews,
  payments,
  admins,
  suspended,
  categories,
  requests
] = await Promise.all([

  supabase.from("users").select("*", { count: "exact", head: true }),

  supabase.from("users")
    .select("*", { count: "exact", head: true })
    .eq("role", "worker"),

  supabase.from("users")
    .select("*", { count: "exact", head: true })
    .eq("role", "contractor"),

  supabase.from("jobs")
    .select("*", { count: "exact", head: true }),

  supabase.from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("status", "active"),

  supabase.from("applications")
    .select("*", { count: "exact", head: true }),

  supabase
  .from("ratings")
  .select("*", { count: "exact", head: true }),

supabase
  .from("payments")
  .select("amount, created_at")
  .eq("status", "success"),

supabase
  .from("users")
  .select("*", { count: "exact", head: true })
  .eq("is_admin", true),

  supabase.from("users")
    .select("*", { count: "exact", head: true })
    .eq("is_suspended", true),

  supabase.from("categories")
    .select("*", { count: "exact", head: true }),

  supabase.from("category_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

])

const { data: latestUsers } = await supabase
  .from("users")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(5)

setRecentUsers(latestUsers || [])

const { data: latestJobs } = await supabase
  .from("jobs")
  .select(`
    *,
    users(full_name)
  `)
  .order("created_at", { ascending: false })
  .limit(5)

setRecentJobs(latestJobs || [])

const monthlyRevenue = {}

payments.data?.forEach(payment => {

  const month = new Date(payment.created_at)
  .toLocaleString("default", {
    month: "short",
    year: "2-digit"
  })

  monthlyRevenue[month] =
    (monthlyRevenue[month] || 0) +
    payment.amount

})

setChartData(

  Object.entries(monthlyRevenue).map(
    ([month, revenue]) => ({
      month,
      revenue
    })
  )

)

const { data: latestPayments } = await supabase
  .from("payments")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(5)

setRecentPayments(latestPayments || [])

const revenue =
  payments.data?.reduce(
    (total, payment) => total + payment.amount,
    0
  ) || 0

    setStats({
  users: users.count || 0,
  workers: workers.count || 0,
  contractors: contractors.count || 0,
  jobs: jobs.count || 0,
  activeJobs: activeJobs.count || 0,
  applications: applications.count || 0,
  reviews: reviews.count || 0,
  admins: admins.count || 0,
  suspended: suspended.count || 0,
  categories: categories.count || 0,
  requests: requests.count || 0,
  revenue,
})
  }

 return (
  <div className="admin-dashboard-layout">

    <AdminSidebar />

    <div className="admin-dashboard-content">

      <h1 className="admin-dashboard-title">
        Admin Dashboard
      </h1>

      <div className="admin-dashboard-grid">

  <div className="admin-dashboard-card">
    <h2>👥 {stats.users}</h2>
    <p>Total Users</p>
  </div>

  <div className="admin-dashboard-card">
    <h2>👷 {stats.workers}</h2>
    <p>Workers</p>
  </div>

  <div className="admin-dashboard-card">
    <h2>🏢 {stats.contractors}</h2>
    <p>Contractors</p>
  </div>

  <div className="admin-dashboard-card">
    <h2>📄 {stats.jobs}</h2>
    <p>Total Jobs</p>
  </div>

  <div className="admin-dashboard-card">
    <h2>🟢 {stats.activeJobs}</h2>
    <p>Active Jobs</p>
  </div>

  <div className="admin-dashboard-card">
    <h2>💼 {stats.applications}</h2>
    <p>Applications</p>
  </div>

  <div className="admin-dashboard-card">
    <h2>⭐ {stats.reviews}</h2>
    <p>Reviews</p>
  </div>

  <div className="admin-dashboard-card">
    <h2>💰 ₦{stats.revenue.toLocaleString()}</h2>
    <p>Revenue</p>
  </div>

  <div className="admin-dashboard-card">
    <h2>👑 {stats.admins}</h2>
    <p>Admins</p>
  </div>

  <div className="admin-dashboard-card">
    <h2>🚫 {stats.suspended}</h2>
    <p>Suspended Users</p>
  </div>

  <div className="admin-dashboard-card">
    <h2>📂 {stats.categories}</h2>
    <p>Categories</p>
  </div>

  <div className="admin-dashboard-card">
    <h2>📩 {stats.requests}</h2>
    <p>Pending Requests</p>
  </div>

</div>

<div className="admin-dashboard-sections">

  <div className="admin-dashboard-panel">
  <h2>👥 Recent Users</h2>

  {recentUsers.map(user => (

    <div
  key={user.id}
  className="recent-user"
  onClick={() => navigate(`/admin/users`)}
>

      <img
        src={
          user.avatar_url ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.full_name || "User"
          )}`
        }
        alt=""
      />

      <div>

        <h4>{user.full_name}</h4>

        <p>{user.email}</p>

      </div>

    </div>

  ))}

</div>

  <div className="admin-dashboard-panel">

  <h2>📄 Recent Jobs</h2>

{recentJobs.map(job => (

  <div
    key={job.id}
    className="recent-job"
  >

    <div>

      <h4>{job.title}</h4>

      <p>
        {job.users?.full_name || "Unknown Contractor"}
      </p>

    </div>

    <button
      className={`job-status ${
        job.status === "active"
          ? "active"
          : "closed"
      }`}
      onClick={() => navigate(`/job/${job.id}`)}
    >
      {job.status === "active"
        ? "Open"
        : "Closed"}
    </button>

  </div>

))}

</div>

</div>

<div className="admin-dashboard-panel">

  <h2>💳 Latest Payments</h2>

  {recentPayments.map(payment => (

    <div
      key={payment.id}
      className="recent-payment"
    >

      <div>

        <h4>
          ₦{payment.amount.toLocaleString()}
        </h4>

        <p>
  {payment.plan || "Boost Job"} •{" "}
  {new Date(payment.created_at).toLocaleDateString()}
</p>

      </div>

      <span
        className={`payment-status ${
          payment.status === "success"
            ? "success"
            : "failed"
        }`}
      >
        {payment.status}
      </span>

    </div>

  ))}

</div>

<AdminCharts
  stats={stats}
  revenueData={chartData}
/>

    </div>

  </div>
)
}

export default AdminDashboard