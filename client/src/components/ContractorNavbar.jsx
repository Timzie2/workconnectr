import toast from "react-hot-toast"
import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import supabase from "../supabaseClient"
import { useAuth } from "../context/AuthContext" // ✅ USE GLOBAL AUTH
import { useTheme } from "../context/ThemeContext"

import {
  Home,
  Briefcase,
  Users,
  Bell,
  User,
  Sun,
  Moon,
  MessageSquare
} from "lucide-react"

import "../styles/ContractorNavbar.css"

function ContractorNavbar() {

  const navigate = useNavigate()
  const { user } = useAuth()
const [profile, setProfile] = useState(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

  const notifRef = useRef(null)
  const profileRef = useRef(null)
  const { darkMode, setDarkMode } = useTheme()

  // ✅ CLOSE DROPDOWNS
  useEffect(() => {
    const handleClickOutside = (event) => {

      if (profileRef.current?.contains(event.target)) return
      if (notifRef.current?.contains(event.target)) return

      setMenuOpen(false)
      setNotifOpen(false)
    }

    document.addEventListener("click", handleClickOutside)

    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [])

  useEffect(() => {

  if (!user) return

  const getProfile = async () => {

    const { data } = await supabase
  .from("users")
  .select("full_name, avatar_url")
  .eq("id", user.id)
  .single()

if (data) {
  setProfile(data)
}
  }

  getProfile()

}, [user])

  // ✅ FETCH NOTIFICATIONS (SAFE)
  useEffect(() => {

    if (!user) return

    const fetchNotifications = async () => {

      const { data, error } = await supabase
        .from("notifications")
.select(`
  *,
  sender:sender_id (
    full_name,
    avatar_url
  )
`)
.eq("user_id", user.id)
.order("created_at", { ascending: false })

      if (error) {
        console.log(error)
        return
      }

      const thirtyDaysAgo = new Date()

thirtyDaysAgo.setDate(
  thirtyDaysAgo.getDate() - 30
)

await supabase
  .from("notifications")
  .delete()
  .lt(
    "created_at",
    thirtyDaysAgo.toISOString()
  )

      setNotifications(data || [])
    }

    fetchNotifications()

  }, [user])

  useEffect(() => {

  if (!user) return

  const channel = supabase
    .channel("contractor-notifications")

    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications"
      },

      async (payload) => {

  const newNotif = payload.new

  // fetch sender info
  const { data: fullNotif } = await supabase
    .from("notifications")
    .select(`
      *,
      sender:sender_id (
        full_name,
        avatar_url
      )
    `)
    .eq("id", newNotif.id)
    .single()

  if (fullNotif?.user_id === user.id) {

    setNotifications(prev => {

      const exists = prev.some(
        notif => notif.id === fullNotif.id
      )

      if (exists) return prev

      return [fullNotif, ...prev]
    })

    new Audio("/notification.mp3").play()

    toast.success(fullNotif.title || "New notification 🔔")
  }
}
    )

    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }

}, [user])

  // ✅ MARK AS READ
  const openNotifications = async () => {

    setNotifOpen(prev => !prev)
  }

  // ✅ LOGOUT
  const handleLogout = async () => {

    const { error } = await supabase.auth.signOut()

    if (error) {
      toast.error("Logout failed")
      return
    }

    toast.success("Logged out 👋")
    navigate("/login")
  }

  const getTimeAgo = (date) => {

  const seconds = Math.floor(
    (new Date() - new Date(date)) / 1000
  )

  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours} hour(s) ago`

  return `${days} day(s) ago`
}

const getNotificationIcon = (type) => {

  switch(type) {

    case "application":
      return "👷"

    case "message":
      return "💬"

    case "payment":
      return "💰"

    case "review":
      return "⭐"

    case "approved":
      return "✅"

    case "rejected":
      return "❌"

    default:
      return "🔔"
  }
}

  return (
    <nav className="navbar">

      <div className="navbar-left">

        <h2 className="logo">WorkConnectr</h2>

        <Link to="/contractor-dashboard" className="nav-link">
          <Home size={18}/> Dashboard
        </Link>

        <Link to="/post-job" className="nav-link">
          <Briefcase size={18}/> Post Job
        </Link>

        <Link to="/contractor-applications" className="nav-link">
          <Users size={18}/> Applicants
        </Link>

      </div>

      <div className="navbar-right">

        {/* 💬 MESSAGES */}
<div
  className="icon-btn"
  onClick={() => {
    setMenuOpen(false)
    setNotifOpen(false)

    navigate("/messages")
  }}
>
  <MessageSquare size={20}/>
</div>

{/* 🔔 NOTIFICATIONS */}
<div
  className="notification"
  ref={notifRef}
  onClick={() => {
    setMenuOpen(false)
    openNotifications()
  }}
>
  <Bell size={20}/>

  {notifications.filter(n => !n.is_read).length > 0 && (
    <span className="notification-count">
      {notifications.filter(n => !n.is_read).length}
    </span>
  )}
</div>

{notifOpen && (
  <div className="notification-panel">

    <div className="notif-header">

  <div className="notif-header-left">

    <span>Notifications</span>

    {notifications.filter(n => !n.is_read).length > 0 && (
      <span className="notif-count">
        {notifications.filter(n => !n.is_read).length} new
      </span>
    )}

  </div>

  {notifications.some(n => !n.is_read) && (
    <button
      className="mark-read-btn"
      onClick={async (e) => {

        e.stopPropagation()

        await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("user_id", user.id)
          .eq("is_read", false)

        setNotifications(prev =>
          prev.map(n => ({
            ...n,
            is_read: true
          }))
        )
      }}
    >
      Mark all read
    </button>
  )}

</div>

    {notifications.length === 0 ? (

      <div className="notif-empty">

  <div className="notif-empty-icon">
    🔔
  </div>

  <h4>No notifications yet</h4>

  <p>
    Applications, messages and updates
    will appear here.
  </p>

</div>

    ) : (

      notifications.map((notif) => (

        <div
  key={notif.id}
  className={`
  contractor-notif-card
  ${!notif.is_read ? "unread" : ""}
  ${notif.type}
`}
  onClick={async () => {

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notif.id)

  setNotifications(prev =>
    prev.map(n =>
      n.id === notif.id
        ? { ...n, is_read: true }
        : n
    )
  )

  if (notif.type === "application") {
    navigate(`/applications/${notif.job_id}`)
  }

  if (notif.type === "message") {
    navigate("/contractor-messages")
  }

  if (notif.type === "payment") {
  navigate("/payments")
}

if (notif.type === "review") {
  navigate("/contractor-profile")
}

if (notif.type === "approved") {
  navigate(`/applications/${notif.job_id}`)
}

if (notif.type === "rejected") {
  navigate(`/applications/${notif.job_id}`)
}

}}
>

  <div className="contractor-notif-avatar">

  {notif.sender?.avatar_url ? (
    <img
      src={notif.sender?.avatar_url}
      alt="worker"
      className="notif-avatar-img"
    />
  ) : (
    getNotificationIcon(notif.type)
  )}

</div>

  <div className="contractor-notif-content">

    <div className="contractor-notif-top">

      {!notif.is_read && (
        <span className="contractor-notif-dot"></span>
      )}

    </div>

    <span className="contractor-notif-title">
  {notif.title}
</span>

<p className="contractor-notif-text">
  {notif.message}
</p>

<div className="notif-actions">

  {notif.sender_id && (
    <button
      className="notif-btn"
      onClick={(e) => {
        e.stopPropagation()
        navigate(`/worker/${notif.sender_id}`)
      }}
    >
      View Applicant
    </button>
  )}

</div>

    <span className="contractor-notif-time">
  {getTimeAgo(notif.created_at)}
</span>

  </div>

</div>

      ))

    )}

  </div>
)}

{/* 👤 PROFILE */}
<div
  className="contractor-profile-icon"
  ref={profileRef}
  onClick={() => {
    setNotifOpen(false) // ✅ close notifications
    setMenuOpen(prev => !prev)
  }}
>
  {profile?.avatar_url ? (
    <img
      src={profile.avatar_url}
      alt="company logo"
      className="contractor-nav-avatar"
    />
  ) : (
    user?.email?.charAt(0).toUpperCase()
  )}
</div>

{/* ✅ NEW DROPDOWN */}
{menuOpen && (
  <div className="profile-dropdown">

    {/* 🔥 USER HEADER */}
    <div 
  className="dropdown-user"
  onClick={() => navigate("/contractor-profile")}
>
  <div className="contractor-dropdown-avatar">
  {profile?.avatar_url ? (
  <img 
    src={profile.avatar_url} 
    alt="company logo" 
    className="contractor-avatar-img"
  />
) : (
    user?.email?.charAt(0).toUpperCase()
  )}
</div>

  <div className="user-info">
    <span className="user-name">
  {profile?.full_name || user?.email}
</span>
    <span className="user-email">
  Contractor
</span>
  </div>
</div>

<div className="dropdown-divider"></div>

    {/* MENU ITEMS */}
    <div onClick={() => navigate("/contractor-profile")}>
  👤 Profile
</div>

    <div>
      ⚙️ Account Settings
    </div>

    <div onClick={() => setDarkMode(prev => !prev)}>
      {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
    </div>

    <div className="dropdown-divider"></div>

    <div className="logout" onClick={handleLogout}>
      🚪 Logout
    </div>

  </div>
)}

      </div>

    </nav>
  )
}

export default ContractorNavbar