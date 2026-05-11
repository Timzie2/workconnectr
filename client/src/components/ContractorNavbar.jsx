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
        .from("applications")
        .select(`
          id,
          job_id,
          is_read,
          created_at,
          users:worker_id(full_name),
          jobs:job_id(title, contractor_id)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.log(error)
        return
      }

      const filtered = data.filter(
        item => item.jobs?.contractor_id === user.id
      )

      setNotifications(filtered)
    }

    fetchNotifications()

  }, [user])

  // ✅ MARK AS READ
  const openNotifications = async () => {

    setNotifOpen(prev => !prev)

    if (!notifOpen && user) {

      await supabase
        .from("applications")
        .update({ is_read: true })
        .in("job_id", notifications.map(n => n.job_id))

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      )
    }
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
  onClick={() => navigate("/contractor-messages")}
>
  <MessageSquare size={20}/>
</div>

{/* 🔔 NOTIFICATIONS */}
<div className="notification" ref={notifRef}>
  <Bell size={20} onClick={openNotifications}/>
</div>

{/* 👤 PROFILE */}
<div
  className="contractor-profile-icon"
  ref={profileRef}
  onClick={() => setMenuOpen(prev => !prev)}
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