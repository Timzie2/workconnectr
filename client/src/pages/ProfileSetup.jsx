import { useState, useEffect } from "react"  
import { useNavigate } from "react-router-dom"  
import supabase from "../supabaseClient"  
  
function ProfileSetup() {  
  
  const navigate = useNavigate()  
  
  const [name, setName] = useState("")  
  const [role, setRole] = useState("worker")  
  const [skills, setSkills] = useState("")  
  const [loading, setLoading] = useState(false)  
  const [user, setUser] = useState(null)  
  
  // ✅ GET LOGGED-IN USER  
  useEffect(() => {  
    const getUser = async () => {  
      const { data: { user } } = await supabase.auth.getUser()  
  
      if (!user) {  
        navigate("/login")  
      } else {  
        setUser(user)  
      }  
    }  
  
    getUser()  
  }, [])  
  
  // ✅ HANDLE PROFILE SAVE  
  const handleSaveProfile = async (e) => {  
    e.preventDefault()  

    if (!user) return  // 🔥 safety fix

    setLoading(true)  
  
    const { error } = await supabase  
      .from("users")  
      .update({  
        full_name: name,   // ✅ FIXED
        role: role,  
        skills: skills  
      })  
      .eq("id", user.id)  
  
    if (error) {  
      alert(error.message)  
      setLoading(false)  
      return  
    }  
  
    alert("Profile saved!")  
  
    // ✅ REDIRECT BASED ON ROLE  
    if (role === "worker") {  
      navigate("/worker-dashboard")  
    } else {  
      navigate("/contractor-dashboard")  
    }  
  }  
  
  return (  
    <div className="login-page">  
      <div className="login-card">  
  
        <h2>Complete Your Profile</h2>  
  
        <form onSubmit={handleSaveProfile}>  
  
          <input  
            type="text"  
            placeholder="Full Name"  
            value={name}  
            onChange={(e)=>setName(e.target.value)}  
            required  
          />  
  
          <select value={role} onChange={(e)=>setRole(e.target.value)}>  
            <option value="worker">Worker</option>  
            <option value="contractor">Contractor</option>  
          </select>  
  
          <input  
            type="text"  
            placeholder="Skills (e.g electrician, plumber)"  
            value={skills}  
            onChange={(e)=>setSkills(e.target.value)}  
          />  
  
          <button type="submit" disabled={loading}>  
            {loading ? "Saving..." : "Continue"}  
          </button>  
  
        </form>  
  
      </div>  
    </div>  
  )  
}  
  
export default ProfileSetup