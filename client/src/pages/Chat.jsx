import { useState, useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import supabase from "../supabaseClient"
import WorkerNavbar from "../components/WorkerNavbar"
import ContractorNavbar from "../components/ContractorNavbar"
import "./chat.css"

function Chat({ darkMode, setDarkMode }) {

const { id } = useParams()

const user = JSON.parse(localStorage.getItem("user"))
const userId = Number(user?.id)
const userRole = user?.role

const receiverId = Number(id)

const [messages, setMessages] = useState([])
const [text, setText] = useState("")
const [receiverName, setReceiverName] = useState("User")

const bottomRef = useRef(null)

/* LOAD CHAT */

useEffect(() => {

if (!userId || !receiverId) return

fetchMessages()
fetchReceiver()

const channel = supabase
.channel("chat-room")
.on(
"postgres_changes",
{
event: "INSERT",
schema: "public",
table: "messages"
},
(payload) => {

const msg = payload.new

if (
(Number(msg.sender_id) === userId && Number(msg.receiver_id) === receiverId) ||
(Number(msg.sender_id) === receiverId && Number(msg.receiver_id) === userId)
){
setMessages(prev => {
if (prev.some(m => m.id === msg.id)) return prev
return [...prev, msg]
})
}

}
)
.subscribe()

return () => {
supabase.removeChannel(channel)
}

}, [userId, receiverId])

/* AUTO SCROLL */

useEffect(() => {
bottomRef.current?.scrollIntoView({ behavior: "smooth" })
}, [messages])

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

/* GET MESSAGES */

const fetchMessages = async () => {

if (!userId || !receiverId) return

// sent
const { data: sent } = await supabase
.from("messages")
.select("*")
.eq("sender_id", userId)
.eq("receiver_id", receiverId)
.order("created_at", { ascending: true })

// received
const { data: received } = await supabase
.from("messages")
.select("*")
.eq("sender_id", receiverId)
.eq("receiver_id", userId)
.order("created_at", { ascending: true })

const all = [...(sent || []), ...(received || [])]

// remove duplicates
const unique = []
const ids = new Set()

for (const msg of all) {
if (!ids.has(msg.id)) {
ids.add(msg.id)
unique.push(msg)
}
}

// sort
unique.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

setMessages(unique)

}

/* SEND MESSAGE + 🔔 NOTIFICATION */

const sendMessage = async () => {

if (!text.trim()) return

// 1️⃣ send message
const { error } = await supabase
.from("messages")
.insert({
sender_id: userId,
receiver_id: receiverId,
message: text,
is_read: false
})

if (!error) {

// 2️⃣ create notification
await supabase
.from("notifications")
.insert({
user_id: receiverId,
type: "message",
message: "You have a new message"
})

setText("")

}

}

/* UI */

return (

<div>{/* 🔥 ROLE BASED NAVBAR */}
{userRole === "worker" ? (
<WorkerNavbar darkMode={darkMode} setDarkMode={setDarkMode} />
) : (
<ContractorNavbar darkMode={darkMode} setDarkMode={setDarkMode} />
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