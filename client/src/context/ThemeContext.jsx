import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext()

export function ThemeProvider({ children }) {

  const [darkMode, setDarkMode] = useState(() => {

    const saved = localStorage.getItem("theme")

    if (saved === "dark") return true
    if (saved === "light") return false

    return window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches

  })

  useEffect(() => {

    if (darkMode) {

      document.body.classList.add("dark")
      document.body.classList.remove("light")

      localStorage.setItem("theme", "dark")

    } else {

      document.body.classList.add("light")
      document.body.classList.remove("dark")

      localStorage.setItem("theme", "light")

    }

    // Makes browser controls match the theme
    document.documentElement.style.colorScheme =
      darkMode ? "dark" : "light"

  }, [darkMode])

  // ✅ Theme toggle
  const toggleTheme = () => {
    setDarkMode(prev => !prev)
  }

  return (

    <ThemeContext.Provider
      value={{
        darkMode,
        toggleTheme
      }}
    >

      {children}

    </ThemeContext.Provider>

  )

}

export const useTheme = () => useContext(ThemeContext)