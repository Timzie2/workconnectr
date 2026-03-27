import { useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"

function Register(){

const [name,setName] = useState("")
const [email,setEmail] = useState("")
const [password,setPassword] = useState("")
const [role,setRole] = useState("worker")

const navigate = useNavigate()

const registerUser = async (e)=>{

e.preventDefault()

try{

// ✅ 1. CREATE AUTH USER
const { data, error } = await supabase.auth.signUp({
email,
password
})

if(error){
alert(error.message)
return
}

// ✅ 2. SAVE EXTRA DATA IN users TABLE
await supabase.from("users").insert({
id: data.user.id, // 🔥 IMPORTANT (UUID)
name,
email,
role,
is_online: false
})

alert("Registration successful")

navigate("/login")

}catch(err){

alert("Registration failed")

}

}

return(

<div style={{
display:"flex",
justifyContent:"center",
alignItems:"center",
height:"90vh"
}}>

<form
onSubmit={registerUser}
style={{
width:"350px",
display:"flex",
flexDirection:"column",
gap:"15px"
}}
>

<h2>Create Account</h2>

<input
placeholder="Name"
value={name}
onChange={(e)=>setName(e.target.value)}
required
/>

<input
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
required
/>

<input
type="password"
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
required
/>

<select
value={role}
onChange={(e)=>setRole(e.target.value)}
>

<option value="worker">Worker</option>
<option value="contractor">Contractor</option>

</select>

<button
style={{
padding:"12px",
background:"#2563eb",
color:"white",
border:"none",
borderRadius:"6px",
cursor:"pointer"
}}
>
Register
</button>

</form>

</div>

)

}

export default Register