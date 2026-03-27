import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { Toaster } from "react-hot-toast"

import App from "./App"
import { SavedProvider } from "./context/SavedContext"
import { AuthProvider } from "./context/AuthContext" // ✅ IMPORT HERE

import "./index.css"
import "./theme.css"

ReactDOM.createRoot(document.getElementById("root")).render(

  <React.StrictMode>

    <BrowserRouter>

      <AuthProvider> {/* ✅ GLOBAL AUTH */}
        <SavedProvider> {/* ✅ SAVED JOBS */}
          
          <App />

        </SavedProvider>
      </AuthProvider>

      <Toaster position="top-right" />

    </BrowserRouter>

  </React.StrictMode>

)