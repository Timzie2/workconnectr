import toast from "react-hot-toast"
import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import supabase from "../supabaseClient"

import {
Home,
Briefcase,
Users,
Bell,
User,
Settings,
LogOut,
Sun,
Moon,
Monitor,
MessageSquare
} from "lucide-react"

import "./Navbar.css"

function ContractorNavbar({ darkMode, setDarkMode }) {

const navigate = useNavigate()

const [menuOpen, setMenuOpen] = useState(false)
const [notifOpen, setNotifOpen] = useState(false)
const [themeMenu, setThemeMenu] = useState(false)
const [notifications, setNotifications] = useState([])
const [userId, setUserId] = useState(null)

const notifRef = useRef(null)
const profileRef = useRef(null)


// GET USER
useEffect(() => {

const user = JSON.parse(localStorage.getItem("user"))

if (user) {
setUserId(user.id)
}

}, [])



// CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
useEffect(() => {

const handleClickOutside = (event) => {

if (
notifRef.current &&
!notifRef.current.contains(event.target)
){
setNotifOpen(false)
}

if (
profileRef.current &&
!profileRef.current.contains(event.target)
){
setMenuOpen(false)
}

}

document.addEventListener("mousedown", handleClickOutside)

return () => {
document.removeEventListener("mousedown", handleClickOutside)
}

}, [])



// FETCH NOTIFICATIONS
useEffect(() => {

if (!userId) return

const fetchNotifications = async () => {

const { data, error } = await supabase
.from("applications")
.select("id,job_id,is_read,created_at,users:worker_id(full_name),jobs:job_id(title,contractor_id)")
.order("created_at", { ascending:false })

if (error) {
console.log("Notification error:", error)
return
}

const filtered = data.filter(
(item) => item.jobs?.contractor_id === userId
)

setNotifications(filtered)

}

fetchNotifications()

const channel = supabase
.channel("applications-channel")
.on(
"postgres_changes",
{
event: "INSERT",
schema: "public",
table: "applications"
},
() => {
fetchNotifications()
toast.success("🔔 New worker applied for your job")
}
)
.subscribe()

return () => {
supabase.removeChannel(channel)
}

}, [userId])



// OPEN NOTIFICATIONS
const openNotifications = async () => {

setNotifOpen(!notifOpen)

if (!notifOpen) {

await supabase
.from("applications")
.update({ is_read:true })
.eq("is_read", false)

setNotifications(prev =>
prev.map(n => ({ ...n, is_read:true }))
)

}

}



// DELETE NOTIFICATION
const deleteNotification = async (id) => {

await supabase
.from("applications")
.delete()
.eq("id", id)

setNotifications(prev =>
prev.filter(n => n.id !== id)
)

}



// THEME SWITCH
const toggleTheme = (mode) => {

if (mode === "light") setDarkMode(false)

if (mode === "dark") setDarkMode(true)

if (mode === "auto") {

const prefersDark =
window.matchMedia("(prefers-color-scheme: dark)").matches

setDarkMode(prefersDark)

}

}



// LOGOUT
const handleLogout = () => {

localStorage.removeItem("user")
navigate("/login")

}



return (

<nav className="navbar">

{/* LEFT SIDE */}
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



{/* RIGHT SIDE */}
<div className="navbar-right">

{/* MESSAGES */}
<div
className="icon-btn"
onClick={() => navigate("/messages")}
title="Messages"
>
<MessageSquare size={20}/>
</div>



{/* NOTIFICATIONS */}
<div className="notification" ref={notifRef}>

<Bell size={20} onClick={openNotifications}/>

<span className="notification-count">
{notifications.filter(n => !n.is_read).length}
</span>


{notifOpen && (

<div className="notification-panel">

<h4 className="notif-header">Notifications</h4>

{notifications.length === 0 && (
<div className="notif-empty">
No notifications yet
</div>
)}

{notifications.map((notif) => (

<div
key={notif.id}
className="notif-card"
onClick={() => navigate("/contractor-applications")}
>

<div className="notif-icon">🔔</div>

<div className="notif-content">

<p className="notif-text">
<strong>{notif.users?.full_name}</strong> applied for{" "}
<strong>{notif.jobs?.title}</strong>
</p>

<p className="notif-time">
{new Date(notif.created_at).toLocaleString()}
</p>

</div>

<button
className="notif-delete"
onClick={(e) => {
e.stopPropagation()
deleteNotification(notif.id)
}}
>
✖
</button>

</div>

))}

</div>

)}

</div>



{/* PROFILE */}
<div
className="profile-icon"
ref={profileRef}
onClick={() => setMenuOpen(!menuOpen)}
>
<User size={18}/>
</div>



{/* PROFILE MENU */}
{menuOpen && (

<div className="profile-dropdown">

<p className="dropdown-title">Your Account</p>

<div className="theme-container">

<div
className="theme-trigger"
onClick={() => setThemeMenu(!themeMenu)}
>
<Monitor size={16}/>
Theme: {darkMode ? "Dark" : "Light"}
</div>

{themeMenu && (

<div className="theme-dropdown">

<div
className="theme-choice"
onClick={() => toggleTheme("auto")}
>
✔ Auto
</div>

<div
className="theme-choice"
onClick={() => toggleTheme("light")}
>
<Sun size={14}/> Light
</div>

<div
className="theme-choice"
onClick={() => toggleTheme("dark")}
>
<Moon size={14}/> Dark
</div>

</div>

)}

</div>

<Link to="/contractor-profile" className="dropdown-item">
<User size={16}/> Your Profile
</Link>

<Link to="/settings" className="dropdown-item">
<Settings size={16}/> Settings
</Link>

<div
className="dropdown-item logout"
onClick={handleLogout}
>
<LogOut size={16}/> Log Out
</div>

</div>

)}

</div>

</nav>

)

}

export default ContractorNavbar