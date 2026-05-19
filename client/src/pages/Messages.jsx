import { useParams } from "react-router-dom"

import { useAuth } from "../context/AuthContext"

import WorkerNavbar from "../components/WorkerNavbar"
import ContractorNavbar from "../components/ContractorNavbar"

import ConversationList from "../components/ConversationList"
import ChatWindow from "../components/ChatWindow"

import "../styles/Messages.css"

function Messages() {

  const { role } = useAuth()

  const { id } = useParams()

  return (

    <div className="messages-wrapper">

      {/* NAVBAR */}

      {role === "worker" ? (

        <WorkerNavbar />

      ) : (

        <ContractorNavbar />

      )}

      {/* MAIN */}

      <div
  className={`messages-page ${
    id ? "chat-open" : ""
  }`}
>

        {/* LEFT SIDEBAR */}

        <ConversationList />

        {/* RIGHT CHAT */}
        
<ChatWindow receiverId={id} />

      </div>

    </div>
  )
}

export default Messages