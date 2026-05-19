import { createContext, useContext, useEffect, useState } from "react"
import supabase from "../supabaseClient"

const AuthContext = createContext()

export function AuthProvider({ children }) {

  const [user, setUser] = useState(undefined)
  const [role, setRole] = useState(null)
const [loading, setLoading] = useState(true)
const [networkError, setNetworkError] = useState(false)

const [profileCompleted, setProfileCompleted] = useState(null)

  useEffect(() => {

  const loadUser = async (sessionUser) => {

  console.log("LOAD USER RUNNING")

  try {

    if (!sessionUser) {

      setUser(null)
      setRole(null)
      setProfileCompleted(null)

      return
    }

    setUser(sessionUser)

    const { data, error } = await supabase
      .from("users")
      .select(`
        role,
        profile_completed
      `)
      .eq("id", sessionUser.id)
      .single()

    console.log("USER DATA:", data)

    if (error) {

      console.error(
        "ROLE FETCH ERROR:",
        error
      )

      setNetworkError(true)

      return
    }

    setNetworkError(false)

    setRole(data.role || "worker")

    setProfileCompleted(
      data.profile_completed ?? false
    )

  } catch (err) {

    console.error(
      "LOAD USER CRASH:",
      err
    )

  } finally {

    setLoading(false)
  }
}

  // ✅ INITIAL SESSION (ONLY ONCE)
  supabase.auth.getSession().then(({ data: { session } }) => {
    loadUser(session?.user)
  })

  // ✅ LISTENER (ONLY FOR SIGN IN / OUT)
  const { data: listener } =
  supabase.auth.onAuthStateChange(
    async (event, session) => {

      console.log("AUTH EVENT:", event)

      if (
  event === "SIGNED_IN" ||
  event === "TOKEN_REFRESHED" ||
  event === "INITIAL_SESSION"
) {

  if (session?.user) {

    supabase
  .from("users")
  .update({
    is_online: true,
    last_seen: null,
    last_active: new Date().toISOString()
  })
  .eq("id", session.user.id)
  .then(({ error }) => {

    console.log(
      "ONLINE UPDATE ERROR:",
      error
    )

  })

setTimeout(() => {

  loadUser(session.user)

}, 500)
  }
}

      if (event === "SIGNED_OUT") {

  if (user?.id) {

    await supabase
      .from("users")
      .update({
        is_online: false,
        last_seen: new Date().toISOString()
      })
      .eq("id", user.id)

  }

  setUser(null)
  setRole(null)
  setProfileCompleted(null)
  setLoading(false)
}
    }
  )

  const handleOffline = async () => {

  if (!user?.id) return

  await supabase
    .from("users")
    .update({
      is_online: false,
      last_seen: new Date().toISOString()
    })
    .eq("id", user.id)
}

window.addEventListener(
  "beforeunload",
  handleOffline
)

  return () => {

  window.removeEventListener(
    "beforeunload",
    handleOffline
  )

  listener.subscription.unsubscribe()
}

}, [])

useEffect(() => {

  if (!user?.id) return

  const heartbeatInterval = setInterval(async () => {

  await supabase
    .from("users")
    .update({
      is_online: true,
      last_active: new Date().toISOString(),
      last_seen: new Date().toISOString()
    })
    .eq("id", user.id)

}, 15000)

  return () => {
    clearInterval(heartbeatInterval)
  }

}, [user])

  return (
    <AuthContext.Provider
  value={{
    user,
    role,
    loading,
    networkError,
    profileCompleted
  }}
>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)