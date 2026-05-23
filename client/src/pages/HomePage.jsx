import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import "../styles/HomePage.css"
import logoIcon from "../assets/logo-icon.png"
import { useEffect, useState } from "react"
import supabase from "../supabaseClient"

function HomePage({
  darkMode,
  setDarkMode
}) {

  const { user, role } = useAuth()

  const navigate = useNavigate()

  const [recentActivity, setRecentActivity] = useState([])

  const [featuredData, setFeaturedData] = useState([])

  const [recentMessages, setRecentMessages] = useState([])

  const [profile, setProfile] = useState(null)

  const [loading, setLoading] = useState(true)


  const [stats, setStats] = useState({
  jobs: 0,
  applications: 0,
  unreadMessages: 0,
  profileCompletion: 0
})

useEffect(() => {

  if (!user || !role) return

  fetchDashboardData()

}, [user, role])

useEffect(() => {

  if (!user) return

  const channel = supabase
    .channel("homepage-live-updates")

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages"
      },
      () => {
        fetchDashboardData()
      }
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "applications"
      },
      () => {
        fetchDashboardData()
      }
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "jobs"
      },
      () => {
        fetchDashboardData()
      }
    )

    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }

}, [user, role])

const fetchDashboardData = async () => {

  setLoading(true)

  const { data: conversations } = await supabase
  .from("conversations")
  .select(`
  id,
  last_message,
  last_message_time,
  last_message_sender_id,
  last_message_read,
  user_one,
  user_two
`)
  .or(`user_one.eq.${user.id},user_two.eq.${user.id}`)
  .order("last_message_time", {
    ascending: false
  })
  .limit(4)



const formattedMessages = await Promise.all(

  (conversations || []).map(async (chat) => {

    const otherUserId =
      chat.user_one === user.id
        ? chat.user_two
        : chat.user_one

    const { data: otherUser } = await supabase
      .from("users")
      .select(`
        id,
        full_name,
        avatar_url
      `)
      .eq("id", otherUserId)
      .single()

    return {
      ...chat,
      otherUser
    }

  })

)

setRecentMessages(formattedMessages)

  const { data: profileData } = await supabase
  .from("users")
  .select(`
    full_name,
    avatar_url
  `)
  .eq("id", user.id)
  .single()

  setProfile(profileData)

 let completion = 0

if (profileData?.full_name) {
  completion += 50
}

if (profileData?.avatar_url) {
  completion += 50
}

  if (role === "worker") {

  // applications
  const { data: applications } = await supabase
    .from("applications")
    .select("id")
    .eq("worker_id", user.id)

  // jobs
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id")
    .eq("status", "open")

  // unread messages
  const { data: unread } = await supabase
    .from("messages")
    .select("id")
    .eq("receiver_id", user.id)
    .eq("is_read", false)

    // recommende jobs
  const { data: recommendedJobs } = await supabase
  .from("jobs")
  .select(`
    id,
    title,
    location,
    contractor:users!jobs_contractor_id_fkey(
      company_name
    )
  `)
  .eq("status", "open")
  .order("created_at", {
    ascending: false
  })
  .limit(3)

setFeaturedData(recommendedJobs || [])

  // ✅ LATEST APPLICATION
  const { data: latestApplication } = await supabase
    .from("applications")
    .select(`
      *,
      jobs(title)
    `)
    .eq("worker_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  setRecentActivity([
  latestApplication
    ? `📄 Applied for ${latestApplication.jobs?.title}`
    : null,

  unread?.length > 0
    ? `💬 You have ${unread.length} unread message(s)`
    : null

].filter(Boolean))

  setStats({
    jobs: jobs?.length || 0,
    applications: applications?.length || 0,
    unreadMessages: unread?.length || 0,
    profileCompletion: completion
  })

  setLoading(false)

}

  // CONTRACTOR
if (role === "contractor") {

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id")
    .eq("contractor_id", user.id)

  const jobIds = jobs?.map(j => j.id) || []

  const { data: applicants } = await supabase
    .from("applications")
    .select("id")
    .in("job_id", jobIds)

  const { data: recentApplicants } = await supabase
  .from("applications")
  .select(`
    id,
    worker_id,
    jobs(title),
    users!applications_worker_id_fkey(
      full_name
    )
  `)
  .in("job_id", jobIds)
  .order("created_at", { ascending: false })
  .limit(3)

setFeaturedData(recentApplicants || [])

  const latestApplicant = applicants?.[0]

  const { data: unread } = await supabase
    .from("messages")
    .select("id")
    .eq("receiver_id", user.id)
    .eq("is_read", false)

  setRecentActivity([

    latestApplicant
      ? `👷 ${applicants.length} worker(s) applied recently`
      : null,

    unread?.length > 0
      ? `💬 You have ${unread.length} unread message(s)`
      : null

  ].filter(Boolean))

  setStats({
    jobs: jobs?.length || 0,
    applications: applicants?.length || 0,
    unreadMessages: unread?.length || 0,
    profileCompletion: completion
  })

  setLoading(false)

}

}

const formatTimeAgo = (date) => {

  const seconds = Math.floor(
    (new Date() - new Date(date)) / 1000
  )

  const minutes = Math.floor(seconds / 60)

  const hours = Math.floor(minutes / 60)

  const days = Math.floor(hours / 24)

  if (seconds < 60) return "Just now"

  if (minutes < 60) {
    return `${minutes}m ago`
  }

  if (hours < 24) {
    return `${hours}h ago`
  }

  return `${days}d ago`
}

  return (

    <div className="welcome-page">

      {/* NAVBAR */}

      <nav className="welcome-navbar">

        <div className="welcome-logo-wrapper">

  <img
    src={logoIcon}
    alt="WorkConnectr Logo"
    className="welcome-logo-icon"
  />

  <div className="welcome-logo">

    <span className="logo-white">
      Work
    </span>

    <span className="logo-green">
      Connectr
    </span>

  </div>

</div>

<div className="navbar-actions">

  <button
    className="theme-toggle-btn"
    onClick={() =>
      setDarkMode(!darkMode)
    }
  >
    {darkMode ? "☀️" : "🌙"}
  </button>

  <button
    className="dashboard-btn"
    onClick={() => {

      if (role === "worker") {
        navigate("/worker-dashboard")
      }

      if (role === "contractor") {
        navigate("/contractor-dashboard")
      }

    }}
  >
    Dashboard
  </button>

</div>

      </nav>

      {/* HERO */}

      <div className="welcome-hero">

        <div className="welcome-avatar">

          {role === "worker" ? "🛠️" : "🏗️"}

        </div>

        <div className="welcome-text">

          <h1>
  Welcome back{profile?.full_name
    ? `, ${profile.full_name.split(" ")[0]}`
    : ""
  } 👋
</h1>

          <p>

  {role === "worker"

    ? `You currently have ${stats.jobs} available jobs and ${stats.unreadMessages} unread message(s).`

    : `You have ${stats.applications} applicant(s) and ${stats.unreadMessages} unread message(s).`

  }

</p>

        </div>

      </div>

      {/* STATS */}

      <div className="overview-grid">

        <div
  className="overview-card"
  onClick={() => navigate(
    role === "worker"
      ? "/jobs"
      : "/post-job"
  )}
>

  <h2>
  {loading ? "..." : stats.jobs}
</h2>

  <p>
    {role === "worker"
      ? "Available Jobs"
      : "Active Job Posts"}
  </p>

</div>

<div
  className="overview-card"
  onClick={() => navigate(
    role === "worker"
      ? "/applications"
      : "/contractor-applications"
  )}
>

  <h2>
  {loading ? "..." : stats.applications}
</h2>

  <p>
    {role === "worker"
      ? "Applications"
      : "New Applicants"}
  </p>

</div>

<div
  className="overview-card"
  onClick={() => navigate(
    role === "worker"
      ? "/worker-profile"
      : "/contractor-profile"
  )}
>

  <h2>
  {loading ? "..." : `${stats.profileCompletion}%`}
</h2>

  <p>
    Profile Completion
  </p>

  <div className="profile-progress">

  <div
    className="profile-progress-fill"
    style={{
      width: `${stats.profileCompletion}%`
    }}
  ></div>

</div>

</div>

<div
  className="overview-card"
  onClick={() => navigate("/messages")}
>

  <h2>
  {loading ? "..." : stats.unreadMessages}
</h2>

  <p>
    Unread Messages
  </p>

</div>
      </div>

      

      {/* QUICK ACTIONS */}

      <div className="section-title">

        <h2>
          Quick Actions
        </h2>

      </div>

      <div className="welcome-actions">

        {role === "worker" && (
          <>

            <div
              className="action-card"
              onClick={() => navigate("/jobs")}
            >

              <h3>
                Explore Jobs
              </h3>

              <p>
                Find jobs that match your skills
              </p>

            </div>

            <div
              className="action-card"
              onClick={() => navigate("/applications")}
            >

              <h3>
                Track Applications
              </h3>

              <p>
                Monitor responses from contractors
              </p>

            </div>

            <div
              className="action-card"
              onClick={() => navigate("/worker-profile")}
            >

              <h3>
                Build Profile
              </h3>

              <p>
                Showcase your skills and experience
              </p>

            </div>

          </>
        )}

        {role === "contractor" && (
          <>

            <div
              className="action-card"
              onClick={() => navigate("/post-job")}
            >

              <h3>
                Post Job
              </h3>

              <p>
                Create new hiring opportunities
              </p>

            </div>

            <div
              className="action-card"
              onClick={() => navigate("/contractor-applications")}
            >

              <h3>
                Applications
              </h3>

              <p>
                Review incoming applicants
              </p>

            </div>

            <div
              className="action-card"
              onClick={() => navigate("/contractor-profile")}
            >

              <h3>
                Edit Profile
              </h3>

              <p>
                Update company information
              </p>

            </div>

          </>
        )}

      </div>

      <div className="dashboard-bottom-grid">

  {/* RECENT ACTIVITY */}

  <div>

    <div className="section-title">
      <h2>Recent Activity</h2>
    </div>

    <div className="activity-list">

      {recentActivity.length > 0 ? (

        recentActivity.map((activity, index) => (

          <div
            key={index}
            className="activity-card"
          >

            <p>{activity}</p>

          </div>

        ))

      ) : (

        <div className="activity-card">

          <p>No recent activity yet</p>

        </div>

      )}

    </div>

  </div>

  {/* NOTIFICATIONS */}

  <div>

    <div className="section-title">
      <h2>Notifications</h2>
    </div>

    <div
      className="notification-preview-card"
      onClick={() => navigate("/messages")}
    >

      <div className="notification-preview-top">

        <span>
          🔔 Latest Updates
        </span>

        <span className="notification-badge">
          {stats.unreadMessages}
        </span>

      </div>

      <p>

        {stats.unreadMessages > 0

          ? `You have ${stats.unreadMessages} unread message(s).`

          : "You're all caught up."

        }

      </p>

    </div>

  </div>

</div>

<div className="section-title">

  <h2>
    {role === "worker"
      ? "Recommended Jobs"
      : "Recent Applicants"}
  </h2>

</div>

<div className="featured-grid">

  {featuredData.length > 0 ? (

    featuredData.map((item) => (

      <div
        key={item.id}
        className="featured-card"
      >

        {role === "worker" ? (

          <>
            <h3>{item.title}</h3>

            <p>
              {item.location || "Remote"} • {" "}
              {item.salary || "Salary not specified"}
            </p>

            <span>
              {item.contractor?.company_name || "Company"}
            </span>

            <button
              className="featured-btn"
              onClick={() => navigate(`/jobs`)}
            >
              View Job
            </button>
          </>

        ) : (

          <>
            <h3>
              {item.users?.full_name || "Worker"}
            </h3>

            <p>
              Applied for{" "}
              {item.jobs?.title}
            </p>

            <button
              className="featured-btn"
              onClick={() =>
                navigate(`/worker/${item.worker_id}`)
              }
            >
              View Profile
            </button>
          </>

        )}

      </div>

    ))

  ) : (

    <div className="activity-card">

      <p>
        No data available yet
      </p>

    </div>

  )}

</div>

<div className="section-title">

  <h2>
    Recent Messages
  </h2>

</div>

<div className="messages-preview-list">

  {recentMessages.length > 0 ? (

  recentMessages.map((msg) => (

    <div
      key={msg.id}
      className="message-preview-card"
      onClick={() =>
        navigate(`/messages/${msg.id}`)
      }
    >

      <div className="message-preview-top">

        <div className="message-preview-user">

          {msg.otherUser?.avatar_url ? (

            <img
              src={msg.otherUser.avatar_url}
              alt="user"
              className="message-preview-avatar"
            />

          ) : (

            <div className="message-preview-avatar fallback">

              {msg.otherUser?.full_name
                ?.charAt(0)
                ?.toUpperCase()
              }

            </div>

          )}

          <div>

            <h4>
              {msg.otherUser?.full_name || "User"}
            </h4>

            <span>
              {formatTimeAgo(
                msg.last_message_time
              )}
            </span>

          </div>

        </div>

        {msg.last_message_sender_id !== user.id &&
 !msg.last_message_read && (
  <div className="message-unread-dot"></div>
)}

      </div>

      <p className="message-preview-text">

        {msg.last_message_sender_id === user.id
  ? "You: "
  : ""
}

        {msg.last_message?.length > 55
          ? `${msg.last_message.slice(0, 55)}...`
          : msg.last_message
        }

      </p>

    </div>

  ))

) : (

  <div className="activity-card">

    <p>
      No recent messages
    </p>

  </div>

)}

</div>

    </div>

  )
}

export default HomePage