import { useState, useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import supabase from "../supabaseClient"
import AppNavbar from "../components/AppNavbar"
import "./chat.css"
import { useAuth } from "../context/AuthContext"

function Chat() {

const { conversationId } = useParams()

const { user, role: userRole } = useAuth()

const userId = user?.id

const [messages, setMessages] = useState([])
const [text, setText] = useState("")
const [receiverName, setReceiverName] = useState("User")
const [typing, setTyping] = useState(false)
const [onlineUsers, setOnlineUsers] = useState([])

const bottomRef = useRef(null)

/* LOAD CHAT */

useEffect(() => {

  if (!userId || !conversationId) return

  let cleanup

  const startChat = async () => {
    cleanup = await loadConversation()
  }

  startChat()

  return () => {
    if (cleanup) cleanup()
  }

}, [userId, conversationId])

/* AUTO SCROLL */

useEffect(() => {
bottomRef.current?.scrollIntoView({ behavior: "smooth" })
}, [messages])

const loadConversation = async () => {

  const { data: convo } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single()

  if (!convo) return

  const otherUserId =
    convo.user_one === userId
      ? convo.user_two
      : convo.user_one

  const { data: otherUser } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", otherUserId)
    .single()

  setReceiverName(
    otherUser?.full_name || "User"
  )

  fetchMessages(conversationId)

  const channel = supabase
    .channel(`chat-${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {

        const msg = payload.new

        setMessages(prev => {

          const exists = prev.some(
            m => m.id === msg.id
          )

          if (exists) return prev

          return [...prev, msg]
        })

      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }

}

/* GET MESSAGES */

const fetchMessages = async (convoId) => {

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", convoId)
    .order("created_at", {
      ascending: true
    })

  if (!error) {
    setMessages(data || [])
  }

  // MARK READ
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("receiver_id", userId)
    .eq("sender_id", receiverId)
}

/* SEND MESSAGE + 🔔 NOTIFICATION */

const sendMessage = async () => {

  if (!text.trim()) return

  const messageText = text

  setText("")

  // MARK READ

const { data: convo } = await supabase
  .from("conversations")
  .select("user_one, user_two")
  .eq("id", convoId)
  .single()

const receiverId =
  convo.user_one === userId
    ? convo.user_two
    : convo.user_one

await supabase
  .from("messages")
  .update({ is_read: true })
  .eq("receiver_id", userId)
  .eq("sender_id", receiverId)

  const { error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,

      sender_id: userId,
      receiver_id: receiverId,

      message: messageText,

      is_read: false
    })

  if (error) {
    console.error(error)
    return
  }

  // UPDATE CONVERSATION
  await supabase
    .from("conversations")
    .update({
      last_message: messageText,
      last_message_time: new Date()
    })
    .eq("id", conversationId)

  // NOTIFICATION
  await supabase
    .from("notifications")
    .insert({
      user_id: receiverId,
      sender_id: userId,

      type: "message",

      message: "You received a new message"
    })
}

if (!conversationId) {

  return (

    <div>

      <AppNavbar />

      <div className="empty-chat-window">

        <div className="empty-chat-content">

          <div className="empty-chat-icon">
            💬
          </div>

          <h2>
            Welcome to Messages
          </h2>

          <p>
            Once you connect with someone,
            your conversations will appear here.
          </p>

          <button className="empty-chat-btn">
            Search for jobs
          </button>

        </div>

      </div>

    </div>
  )
}

/* UI */

return (

<div>{/* 🔥 ROLE BASED NAVBAR */}
<AppNavbar />

<div className="chat-container"><h2 className="chat-title">
Chat with {receiverName}
</h2><div className="chat-messages">{messages.map((msg) => {

const isMine = Number(msg.sender_id) === userId

return (

<div
key={msg.id}
className={`message ${isMine ? "sent" : "received"}`}
>{!isMine && (
<img src="/default-avatar.png" className="chat-avatar" />
)}

<div className="message-bubble">
<p>{msg.message}</p>
<span className="message-time">
{new Date(msg.created_at).toLocaleTimeString()}
</span>
</div></div>)

})}

<div ref={bottomRef}></div></div><div className="chat-input"><input
value={text}
onChange={(e) => setText(e.target.value)}
onKeyDown={(e) => e.key === "Enter" && sendMessage()}
placeholder="Type message..."
/>

<button onClick={sendMessage}>
Send
</button></div></div></div>)

}

export default Chat