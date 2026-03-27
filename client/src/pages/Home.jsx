import { useNavigate } from "react-router-dom"

function Home(){

const navigate = useNavigate()

return(

<div style={{
minHeight:"90vh",
display:"flex",
flexDirection:"column",
justifyContent:"center",
alignItems:"center",
textAlign:"center"
}}>

<h1 style={{fontSize:"60px"}}>WorkConnectr</h1>

<p style={{fontSize:"20px", marginTop:"10px"}}>
Connecting Skilled Workers with Contractors
</p>

<div style={{marginTop:"30px"}}>

<button
onClick={()=>navigate("/jobs")}
style={{
padding:"14px 26px",
fontSize:"16px",
background:"#2563eb",
color:"white",
border:"none",
borderRadius:"8px",
marginRight:"15px",
cursor:"pointer"
}}
>
I'm a Worker
</button>

<button
onClick={()=>navigate("/post-job")}
style={{
padding:"14px 26px",
fontSize:"16px",
background:"#111827",
color:"white",
border:"none",
borderRadius:"8px",
cursor:"pointer"
}}
>
I'm a Contractor
</button>

</div>

</div>

)

}

export default Home