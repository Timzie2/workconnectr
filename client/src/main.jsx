import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { Toaster } from "react-hot-toast"

import App from "./App"
import { SavedProvider } from "./context/SavedContext"
import { AuthProvider } from "./context/AuthContext"

import "./index.css"
import "./theme.css"
import { ThemeProvider } from "./context/ThemeContext"

ReactDOM.createRoot(document.getElementById("root")).render(

  <BrowserRouter>

  <AuthProvider>
    <SavedProvider>
      <ThemeProvider>   
        <App />
      </ThemeProvider>
    </SavedProvider>
  </AuthProvider>

  <Toaster position="top-right" />

</BrowserRouter>

)