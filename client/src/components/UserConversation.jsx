import { useEffect, useState } from "react"
import supabase from "../supabaseClient"

function UserConversation({ userId, message, onClick }) {

const [user,setUser] = useState(null)

useEffect(()=>{

const fetchUser = async()=>{

const { data } = await supabase
.from("users")
.select("full_name, avatar_url")
.eq("id", userId)
.single()

setUser(data)

}

fetchUser()

},[userId])

return(

<div
onClick={onClick}
style={{
display:"flex",
alignItems:"center",
gap:"12px",
border:"1px solid #ddd",
padding:"12px",
marginBottom:"10px",
borderRadius:"10px",
cursor:"pointer"
}}
><img
src={user?.avatar_url || "/default-avatar.png"}
style={{
width:"40px",
height:"40px",
borderRadius:"50%"
}}
/>

<div>
<p style={{margin:0,fontWeight:"bold"}}>
{user?.full_name || "User"}
</p><p style={{margin:0,opacity:0.7}}>
{message}
</p>
</div></div>)

}

export default UserConversation