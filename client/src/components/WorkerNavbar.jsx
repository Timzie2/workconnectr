import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import supabase from "../supabaseClient"

import {
  Home,
  Briefcase,
  FileText,
  User,
  LogOut,
  MessageSquare,
  Star,
  Bell
} from "lucide-react"

import "./WorkerNavbar.css"

function WorkerNavbar(){

  const navigate = useNavigate()

  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const [notifications, setNotifications] = useState([])
  const [userId, setUserId] = useState(null)

  const profileRef = useRef(null)
  const notifRef = useRef(null)

  /* ✅ AUTH CHECK */
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        localStorage.clear()
        window.location.replace("/login")
      } else {
        setUserId(user.id)
      }
    }

    checkUser()
  }, [])

  /* ✅ CLOSE DROPDOWNS */
  useEffect(() => {

    const handleClickOutside = (event) => {

      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setMenuOpen(false)
      }

      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false)
      }
    }

    document.addEventListener("click", handleClickOutside)

    return () => {
      document.removeEventListener("click", handleClickOutside)
    }

  }, [])

  /* ✅ FETCH + REALTIME NOTIFICATIONS */
  useEffect(() => {

    if (!userId) return

    fetchNotifications()

    // 🔥 REALTIME (FILTERED FOR USER)
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications"
        },
        (payload) => {

          // ✅ ONLY ADD FOR THIS USER
          if (payload.new.user_id === userId) {

            setNotifications(prev => {

              // 🚫 PREVENT DUPLICATES
              const exists = prev.some(n => n.id === payload.new.id)
              if (exists) return prev

              return [payload.new, ...prev]
            })

          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }

  }, [userId])

  /* ✅ FETCH */
  const fetchNotifications = async () => {

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (!error) {
      setNotifications(data || [])
    }
  }

  /* 🔔 UNREAD COUNT (OPTIMIZED) */
  const unreadCount = notifications.reduce(
    (count, n) => count + (!n.is_read ? 1 : 0),
    0
  )

  /* ✅ OPEN + MARK READ */
  const openNotifications = async () => {

    const willOpen = !notifOpen
    setNotifOpen(willOpen)

    // ✅ ONLY MARK WHEN OPENING
    if (willOpen && unreadCount > 0) {

      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)

      // 🔥 INSTANT UI UPDATE
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      )
    }
  }

  /* ✅ LOGOUT */
  const logout = async () => {

    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error(err)
    }

    localStorage.clear()
    sessionStorage.clear()

    window.location.replace("/login")
  }

  return(

    <nav className="worker-navbar">

      {/* LEFT */}
      <div className="worker-navbar-left">

        <h2 className="worker-logo">WorkConnectr</h2>

        <Link to="/worker-dashboard" className="worker-nav-link">
          <Home size={18}/> Dashboard
        </Link>

        <Link to="/jobs" className="worker-nav-link">
          <Briefcase size={18}/> Jobs
        </Link>

        <Link to="/applications" className="worker-nav-link">
          <FileText size={18}/> Applications
        </Link>

        <Link to="/saved-jobs" className="worker-nav-link">
          <Star size={18}/> Saved
        </Link>

      </div>

      {/* RIGHT */}
      <div className="worker-navbar-right">

        {/* 💬 MESSAGES */}
        <div
          className="worker-icon-btn"
          onClick={() => navigate("/worker-messages")}
        >
          <MessageSquare size={20}/>
        </div>

        {/* 🔔 NOTIFICATIONS */}
        <div
          className="worker-notification"
          ref={notifRef}
          onClick={openNotifications}
        >
          <Bell size={20}/>

          {/* 🔴 BADGE */}
          {unreadCount > 0 && (
            <span className="worker-notification-count">
              {unreadCount}
            </span>
          )}

          {/* 📩 DROPDOWN */}
          {notifOpen && (
            <div className="worker-notification-panel">

              <h4>Notifications</h4>

              {notifications.length === 0 ? (
                <p>No notifications</p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="worker-notif-item"
                    style={{
                      background: notif.is_read ? "#0f172a" : "#334155"
                    }}
                  >
                    {notif.message}
                  </div>
                ))
              )}

            </div>
          )}

        </div>

        {/* 👤 PROFILE */}
        <div
          className="worker-profile-icon"
          ref={profileRef}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <User size={18}/>
        </div>

        {menuOpen && (
          <div className="worker-profile-dropdown">

            <Link to="/worker-profile" className="worker-dropdown-item">
              <User size={16}/> Profile
            </Link>

            <div
              className="worker-dropdown-item logout"
              onClick={logout}
            >
              <LogOut size={16}/> Logout
            </div>

          </div>
        )}

      </div>

    </nav>
  )
}

export default WorkerNavbar