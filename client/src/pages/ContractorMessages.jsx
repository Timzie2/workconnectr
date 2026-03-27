import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import ContractorNavbar from "../components/ContractorNavbar"

function ContractorMessages({ darkMode, setDarkMode }) {

const navigate = useNavigate()
const [conversations, setConversations] = useState([])

const user = JSON.parse(localStorage.getItem("user"))
const userId = Number(user?.id)

useEffect(() => {
fetchConversations()
}, [])

const fetchConversations = async () => {

if (!userId) return

const { data } = await supabase
.from("messages")
.select("*")
.or("sender_id.eq.${userId},receiver_id.eq.${userId}")
.order("created_at", { ascending: false })

if (!data) return

const unique = {}

for (const msg of data) {

const otherUser =
Number(msg.sender_id) === userId
? msg.receiver_id
: msg.sender_id

if (!unique[otherUser]) {
unique[otherUser] = msg
}

}

setConversations(Object.values(unique))

}

return (

<div><ContractorNavbar
darkMode={darkMode}
setDarkMode={setDarkMode}
/>

<div style={{ padding: "40px" }}><h2>Messages</h2>{conversations.length === 0 && (

<p>No conversations yet</p>
)}{conversations.map((conv) => {

const otherUser =
Number(conv.sender_id) === userId
? conv.receiver_id
: conv.sender_id

return (

<div
key={conv.id}
onClick={() => navigate(`/contractor/chat/${otherUser}`)} // ✅ FIXED
style={{
border: "1px solid #ddd",
padding: "15px",
marginBottom: "12px",
borderRadius: "10px",
cursor: "pointer"
}}
><p style={{ fontWeight: "bold" }}>
Conversation with user {otherUser}
</p><p>{conv.message}</p></div>)

})}

</div></div>)

}

export default ContractorMessages