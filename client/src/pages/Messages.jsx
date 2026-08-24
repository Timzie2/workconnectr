import { useParams } from "react-router-dom"

import { useAuth } from "../context/AuthContext"

import AppNavbar from "../components/AppNavbar"

import ConversationList from "../components/ConversationList"
import ChatWindow from "../components/ChatWindow"

import "../styles/Messages.css"

function Messages() {

  const { role } = useAuth()

  const { id } = useParams()
  console.log("CURRENT ID:", id)

  console.log("CURRENT ID:", id)

  return (

    <div className="messages-wrapper">

      {/* NAVBAR */}

      <AppNavbar />

      {/* MAIN */}

      <div
  className={`messages-page ${
    id ? "chat-open" : ""
  }`}
>

        {/* LEFT SIDEBAR */}

        <ConversationList />

        {/* RIGHT CHAT */}
        
<ChatWindow conversationId={id} />

      </div>

    </div>
  )
}

export default Messages