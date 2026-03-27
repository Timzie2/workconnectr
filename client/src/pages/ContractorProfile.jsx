import { useState, useEffect } from "react"
import supabase from "../supabaseClient"
import ContractorNavbar from "../components/ContractorNavbar"
import "./Profile.css"

function ContractorProfile({ darkMode, setDarkMode }) {

const [company, setCompany] = useState("")
const [location, setLocation] = useState("")
const [about, setAbout] = useState("")
const [logo, setLogo] = useState("")

const [jobsPosted, setJobsPosted] = useState(0)
const [activeJobs, setActiveJobs] = useState(0)
const [applications, setApplications] = useState(0)

/* LOAD PROFILE + STATS */

useEffect(() => {

const loadData = async () => {

const user = JSON.parse(localStorage.getItem("user"))

if (!user) {
console.log("User not logged in")
return
}

const userId = user.id

/* LOAD PROFILE */

const { data: profile, error: profileError } = await supabase
.from("users")
.select("company_name, location, about_company, company_logo")
.eq("id", userId)
.single()

if (!profileError && profile) {
setCompany(profile.company_name || "")
setLocation(profile.location || "")
setAbout(profile.about_company || "")
setLogo(profile.company_logo || "")
}

/* TOTAL JOBS */

const { data: jobs, error: jobsError } = await supabase
.from("jobs")
.select("*")
.eq("contractor_id", userId)

if (!jobsError && jobs) {
setJobsPosted(jobs.length)
}

/* ACTIVE JOBS */

const { data: active, error: activeError } = await supabase
.from("jobs")
.select("*")
.eq("contractor_id", userId)
.eq("status", "open")

if (!activeError && active) {
setActiveJobs(active.length)
}

/* APPLICATIONS (ONLY FOR THIS CONTRACTOR'S JOBS) */

const { data: apps, error: appsError } = await supabase
.from("applications")
.select("id, jobs!inner(contractor_id)")
.eq("jobs.contractor_id", userId)

if (!appsError && apps) {
setApplications(apps.length)
}

}

loadData()

}, [])

/* LOGO UPLOAD */

const uploadLogo = async (e) => {

const file = e.target.files[0]

if (!file) return

const fileName = Date.now() + "-" + file.name

const { error } = await supabase.storage
.from("company-logos")
.upload(fileName, file)

if (error) {
console.log(error)
alert("Logo upload failed")
return
}

const { data } = supabase.storage
.from("company-logos")
.getPublicUrl(fileName)

setLogo(data.publicUrl)

}

/* SAVE PROFILE */

const saveProfile = async () => {

const user = JSON.parse(localStorage.getItem("user"))

if (!user) {
alert("User not logged in")
return
}

const userId = user.id

const { error } = await supabase
.from("users")
.update({
company_name: company,
location: location,
about_company: about,
company_logo: logo
})
.eq("id", userId)

if (error) {
console.log(error)
alert("Failed to save profile")
return
}

alert("Profile saved successfully!")

}

return (

<div><ContractorNavbar
darkMode={darkMode}
setDarkMode={setDarkMode}
/>

<div className="profile-page">
<div className="profile-card">{/* HEADER */}

<div className="profile-header"><div className="company-avatar">
{logo ? (
<img src={logo} alt="logo" />
) : (
"🏢"
)}
</div><div>
<h2>{company || "Your Company"}</h2>
<p className="company-location">
📍 {location || "Add location"}
</p>
</div></div>{/* STATS */}

<div className="profile-stats"><div className="stat-box">
<h3>{jobsPosted}</h3>
<p>Jobs Posted</p>
</div><div className="stat-box">
<h3>{activeJobs}</h3>
<p>Active Jobs</p>
</div><div className="stat-box">
<h3>{applications}</h3>
<p>Applications</p>
</div></div>{/* LOGO */}

<label>Upload Company Logo</label>

<input
type="file"
accept="image/*"
onChange={uploadLogo}
/>

{/* COMPANY */}

<label>Company Name</label>

<input
type="text"
placeholder="ConstructionLabour Ltd"
value={company}
onChange={(e) => setCompany(e.target.value)}
/>

{/* LOCATION */}

<label>Location</label>

<input
type="text"
placeholder="Lagos"
value={location}
onChange={(e) => setLocation(e.target.value)}
/>

{/* ABOUT */}

<label>About Company</label>

<textarea
placeholder="Tell workers about your company..."
value={about}
onChange={(e) => setAbout(e.target.value)}
/>

<button onClick={saveProfile}>
Save Profile
</button>

</div>
</div>

</div>

)

}

export default ContractorProfile