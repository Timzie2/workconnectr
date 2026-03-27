import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"

function PostJob(){

  const navigate = useNavigate()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [salary, setSalary] = useState("")
  const [category, setCategory] = useState("")

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  // ✅ GET LOGGED-IN USER (SAFE)
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser()

      if (error || !data?.user) {
        navigate("/login")
      } else {
        setUser(data.user)
      }
    }

    getUser()
  }, [])

  // ✅ POST JOB (FIXED + SAFE)
  const handlePostJob = async (e) => {
    e.preventDefault()

    if (!user) {
      alert("You must be logged in")
      return
    }

    if (!title || !description) {
      alert("Title and description are required")
      return
    }

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
            category,
            contractor_id: user.id, // ✅ CORRECT UUID
            created_at: new Date().toISOString()
          }
        ])

      if (error) throw error

      alert("Job posted successfully 🚀")

      navigate("/contractor-dashboard")

    } catch (err) {
      console.error(err)
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (

    <div className="dashboard-container">

      <h1>Post a Job</h1>

      <form onSubmit={handlePostJob} className="profile-card">

        <input
          placeholder="Job Title"
          value={title}
          onChange={(e)=>setTitle(e.target.value)}
          required
        />

        <textarea
          placeholder="Job Description"
          value={description}
          onChange={(e)=>setDescription(e.target.value)}
          required
        />

        <input
          placeholder="Location"
          value={location}
          onChange={(e)=>setLocation(e.target.value)}
        />

        <input
          type="number"
          placeholder="Salary per day (₦)"
          value={salary}
          onChange={(e)=>setSalary(e.target.value)}
        />

        <input
          placeholder="Category (e.g Construction, Electrical)"
          value={category}
          onChange={(e)=>setCategory(e.target.value)}
        />

        <button type="submit" className="post-job-btn" disabled={loading}>
          {loading ? "Posting..." : "Post Job"}
        </button>

      </form>

    </div>
  )
}

export default PostJob