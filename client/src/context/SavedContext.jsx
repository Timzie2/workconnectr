import { createContext, useContext, useState, useEffect, useRef } from "react"
import supabase from "../supabaseClient"
import { useAuth } from "./AuthContext"

const SavedContext = createContext()

export function SavedProvider({ children }) {

  const { user, loading } = useAuth() // ✅ include loading
  const [savedJobs, setSavedJobs] = useState([])

  const hasFetched = useRef(false) // 🔥 prevent duplicate calls

  useEffect(() => {

    // 🚫 WAIT UNTIL AUTH IS READY
    if (loading || !user || hasFetched.current) return

    hasFetched.current = true

    const fetchSaved = async () => {

      try {
        const { data, error } = await supabase
          .from("saved_jobs")
          .select("job_id")
          .eq("user_id", user.id)

        if (!error && data) {
          setSavedJobs(data.map(item => item.job_id))
        }

      } catch (err) {
        console.error("Saved jobs error:", err.message)
      }
    }

    // 🔥 DELAY TO AVOID LOCK CONFLICT
    const timer = setTimeout(fetchSaved, 300)

    return () => clearTimeout(timer)

  }, [user, loading])

  const toggleSave = async (jobId) => {

    if (!user) return

    const isSaved = savedJobs.includes(jobId)

    try {

      if (isSaved) {

        await supabase
          .from("saved_jobs")
          .delete()
          .eq("user_id", user.id)
          .eq("job_id", jobId)

        setSavedJobs(prev => prev.filter(id => id !== jobId))

      } else {

        await supabase
          .from("saved_jobs")
          .insert({
            user_id: user.id,
            job_id: jobId
          })

        setSavedJobs(prev => [...prev, jobId])
      }

    } catch (err) {
      console.error("Toggle save error:", err.message)
    }
  }

  return (
    <SavedContext.Provider value={{ savedJobs, toggleSave }}>
      {children}
    </SavedContext.Provider>
  )
}

export const useSaved = () => useContext(SavedContext)