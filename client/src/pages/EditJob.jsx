import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import ContractorNavbar from "../components/ContractorNavbar"

function EditJob(){

const {id} = useParams()
const navigate = useNavigate()

const [title,setTitle] = useState("")
const [description,setDescription] = useState("")
const [location,setLocation] = useState("")
const [salary,setSalary] = useState("")

useEffect(()=>{
fetchJob()
},[])

async function fetchJob(){

const {data,error} = await supabase
.from("jobs")
.select("*")
.eq("id",id)
.single()

if(!error){
setTitle(data.title)
setDescription(data.description)
setLocation(data.location)
setSalary(data.salary)
}

}

async function updateJob(e){
e.preventDefault()

await supabase
.from("jobs")
.update({
title,
description,
location,
salary
})
.eq("id",id)

alert("Job Updated")

navigate("/contractor-dashboard")
}

return(

<>
<ContractorNavbar/>

<div className="form-container">

<h2>Edit Job</h2>

<form onSubmit={updateJob}>

<input
value={title}
onChange={(e)=>setTitle(e.target.value)}
placeholder="Job Title"
/>

<textarea
value={description}
onChange={(e)=>setDescription(e.target.value)}
placeholder="Description"
/>

<input
value={location}
onChange={(e)=>setLocation(e.target.value)}
placeholder="Location"
/>

<input
value={salary}
onChange={(e)=>setSalary(e.target.value)}
placeholder="Salary"
/>

<button type="submit">
Save Changes
</button>

</form>

</div>

</>

)

}

export default EditJob