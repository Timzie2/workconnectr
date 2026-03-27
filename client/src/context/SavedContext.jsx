import { createContext, useContext, useState, useEffect } from "react"
import supabase from "../supabaseClient"

const SavedContext = createContext()

export function SavedProvider({ children }) {

  const [savedJobs, setSavedJobs] = useState([])

  useEffect(() => {
    loadSaved()
  }, [])

  async function loadSaved() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("saved_jobs")
      .select("job_id")
      .eq("user_id", user.id)

    setSavedJobs(data?.map(item => item.job_id) || [])
  }

  async function toggleSave(jobId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (savedJobs.includes(jobId)) {
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
  }

  return (
    <SavedContext.Provider value={{ savedJobs, toggleSave }}>
      {children}
    </SavedContext.Provider>
  )
}

export function useSaved() {
  return useContext(SavedContext)
}