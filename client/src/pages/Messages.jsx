import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import ContractorNavbar from "../components/ContractorNavbar"

function Messages({ darkMode, setDarkMode }) {

const navigate = useNavigate()

const [conversations, setConversations] = useState([])

useEffect(() => {
fetchConversations()
}, [])


const fetchConversations = async () => {

const user = JSON.parse(localStorage.getItem("user"))

if (!user) return

const userId = user.id


const { data, error } = await supabase
.from("messages")
.select(`
*,
sender:sender_id(full_name),
receiver:receiver_id(full_name)
`)
.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
.order("created_at", { ascending: false })


if (error) {
console.log(error)
return
}

if (!data) return


const unique = {}

data.forEach(msg => {

const otherUser =
msg.sender_id === userId
? msg.receiver_id
: msg.sender_id

if (!unique[otherUser]) {
unique[otherUser] = msg
}

})


setConversations(Object.values(unique))

}



return (

<div>

<ContractorNavbar
darkMode={darkMode}
setDarkMode={setDarkMode}
/>


<div style={{ padding: "40px" }}>

<h2>Messages</h2>


{conversations.length === 0 && (
<p>No conversations yet</p>
)}


{conversations.map((msg) => {

const user = JSON.parse(localStorage.getItem("user"))

const otherUser =
msg.sender_id === user.id
? msg.receiver_id
: msg.sender_id


const otherUserName =
msg.sender_id === user.id
? msg.receiver?.full_name
: msg.sender?.full_name


return (

<div
key={msg.id}
onClick={() => navigate(`/chat/${otherUser}`)}
style={{
border: "1px solid #ddd",
padding: "20px",
marginBottom: "15px",
borderRadius: "10px",
cursor: "pointer"
}}
>

<div style={{ display: "flex", alignItems: "center" }}>

<img
src="/default-avatar.png"
style={{
width: "40px",
height: "40px",
borderRadius: "50%",
marginRight: "15px"
}}
/>


<div>

<p style={{ fontWeight: "bold" }}>
{otherUserName || "User"}
</p>

<p>
{msg.message}
</p>

<p style={{ fontSize: "12px", opacity: "0.6" }}>
{new Date(msg.created_at).toLocaleString()}
</p>

</div>

</div>

</div>

)

})}

</div>

</div>

)

}

export default Messages