import { useState, useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import supabase from "../supabaseClient"
import WorkerNavbar from "../components/WorkerNavbar"
import ContractorNavbar from "../components/ContractorNavbar"
import "./chat.css"
import { useAuth } from "../context/AuthContext"

function Chat() {

const { id } = useParams()

const { user, role: userRole } = useAuth()

const userId = user?.id

const receiverId = Number(id)

const [messages, setMessages] = useState([])
const [text, setText] = useState("")
const [receiverName, setReceiverName] = useState("User")

const [conversationId, setConversationId] = useState(null)
const [typing, setTyping] = useState(false)
const [onlineUsers, setOnlineUsers] = useState([])

const bottomRef = useRef(null)

/* LOAD CHAT */

useEffect(() => {

  if (!userId || !receiverId) return

  let cleanup

  const startChat = async () => {
    cleanup = await initializeChat()
  }

  startChat()

  return () => {
    if (cleanup) cleanup()
  }

}, [userId, receiverId])

/* AUTO SCROLL */

useEffect(() => {
bottomRef.current?.scrollIntoView({ behavior: "smooth" })
}, [messages])

const initializeChat = async () => {

 const cleanup =
  await fetchOrCreateConversation()

fetchReceiver()

return cleanup
}

/* GET RECEIVER NAME */

const fetchReceiver = async () => {

const { data } = await supabase
.from("users")
.select("full_name")
.eq("id", receiverId)
.single()

if (data) {
setReceiverName(data.full_name || "User")
}

}

const fetchOrCreateConversation = async () => {

  // CHECK EXISTING
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .or(
      `and(user_one.eq.${userId},user_two.eq.${receiverId}),
       and(user_one.eq.${receiverId},user_two.eq.${userId})`
    )
    .maybeSingle()

  let convoId = existing?.id

  // CREATE IF NOT EXISTS
  if (!convoId) {

    const { data: newConversation, error } =
      await supabase
        .from("conversations")
        .insert({
          user_one: userId,
          user_two: receiverId
        })
        .select()
        .single()

    if (error) {
      console.error(error)
      return
    }

    convoId = newConversation.id
  }

  setConversationId(convoId)

  fetchMessages(convoId)

  // REALTIME
  const channel = supabase
    .channel(`chat-${convoId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${convoId}`
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

if (!receiverId) {

  return (

    <div>

      {userRole === "worker" ? (
        <WorkerNavbar />
      ) : (
        <ContractorNavbar />
      )}

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
{userRole === "worker" ? (
<WorkerNavbar />
) : (
<ContractorNavbar />
)}

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