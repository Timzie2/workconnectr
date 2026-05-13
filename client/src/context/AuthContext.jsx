import { createContext, useContext, useEffect, useState } from "react"
import supabase from "../supabaseClient"

const AuthContext = createContext()

export function AuthProvider({ children }) {

  const [user, setUser] = useState(undefined)
  const [role, setRole] = useState(null) // ✅ ADD ROLE
  const [loading, setLoading] = useState(true)
  const [networkError, setNetworkError] = useState(false)

  useEffect(() => {

  let isMounted = true // 🛑 prevents double execution issues

  const loadUser = async (sessionUser) => {
    console.log("AUTH USER:", sessionUser)

    if (!isMounted) return

    if (!sessionUser) {
      setUser(null)
      setRole(null)
      setLoading(false)
      return
    }

    // 🛑 prevent duplicate runs
    setUser(prev => {
      if (prev?.id === sessionUser.id) return prev
      return sessionUser
    })

    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", sessionUser.id)
      .maybeSingle()

    if (error) {
      console.error("ROLE FETCH ERROR:", error)
    }

    let finalRole = "worker"

    if (error) {
  console.error("ROLE FETCH ERROR:", error)

  setNetworkError(true)

  setLoading(false)

  return
}

if (!data) {
  console.log("User row not found")
  setLoading(false)
  return
}

finalRole = data.role || "worker"

setNetworkError(false)

    setRole(finalRole)

    console.log("SETTING LOADING FALSE")
    setLoading(false)
  }

  // ✅ INITIAL SESSION (ONLY ONCE)
  supabase.auth.getSession().then(({ data: { session } }) => {
    loadUser(session?.user)
  })

  // ✅ LISTENER (ONLY FOR SIGN IN / OUT)
  const { data: listener } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log("AUTH EVENT:", event)

      if (event === "SIGNED_IN") {
        loadUser(session?.user)
      }

      if (event === "SIGNED_OUT") {
        setUser(null)
        setRole(null)
        setLoading(false)
      }
    }
  )

  return () => {
    isMounted = false
    listener.subscription.unsubscribe()
  }

}, [])

  return (
    <AuthContext.Provider
  value={{
    user,
    role,
    loading,
    networkError
  }}
>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)