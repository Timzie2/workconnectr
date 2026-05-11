import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import WorkerNavbar from "../components/WorkerNavbar"
import "../styles/WorkerProfile.css"

function WorkerProfile(){

  const navigate = useNavigate()

  const [user,setUser] = useState(null)

  const [profile,setProfile] = useState({
  full_name:"",
  headline:"",
  phone:"",
  availability:"Available",
  location:"",
  skills:"",
  experience:"",
  avatar_url:""
})

  const [avgRating,setAvgRating] = useState(0)
  const [ratingCount,setRatingCount] = useState(0)
  const [rating,setRating] = useState(0)
  const [review,setReview] = useState("")

  const [loading,setLoading] = useState(true)

  // ✅ FIXED AUTH (NO LOGOUT 🔥)
  useEffect(()=>{
    getSession()
  },[])

  async function getSession(){

    const { data } = await supabase.auth.getSession()

    if(!data?.session){
      navigate("/login") // ✅ FIXED
      return
    }

    const currentUser = data.session.user

    setUser(currentUser)

    await fetchProfile(currentUser.id)
    await fetchRating(currentUser.id)

    setLoading(false)
  }

  // ✅ FETCH PROFILE
  async function fetchProfile(userId){

    const {data} = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if(data){
      setProfile(data)
    } else {

      const newProfile = {
        id:userId,
        full_name:"",
        location:"",
        skills:"",
        experience:"",
        avatar_url:""
      }

      await supabase.from("profiles").insert(newProfile)
      setProfile(newProfile)
    }
  }

  // ⭐ FETCH RATING
  async function fetchRating(userId){

    const { data } = await supabase
      .from("ratings")
      .select("rating")
      .eq("reviewed_id", userId)

    if(data && data.length > 0){

      const avg =
        data.reduce((a,b)=> a + b.rating,0) / data.length

      setAvgRating(avg.toFixed(1))
      setRatingCount(data.length)

    }else{
      setAvgRating(0)
      setRatingCount(0)
    }
  }

  // ⭐ SUBMIT RATING
  async function submitRating(){

    if(!rating){
      alert("Select a rating")
      return
    }

    if(user.id === profile.id){
      alert("You cannot rate yourself")
      return
    }

    const { error } = await supabase
      .from("ratings")
      .insert({
        reviewer_id:user.id,
        reviewed_id:profile.id,
        rating,
        review
      })

    if(error){
      alert("You already rated this user")
    }else{
      alert("Rating submitted")
      setRating(0)
      setReview("")
      fetchRating(profile.id)
    }
  }

  // 📸 UPLOAD IMAGE
async function uploadAvatar(e){

  const file = e.target.files[0]

  if(!file || !user) return

  const fileExt = file.name.split(".").pop()

  const fileName = `${user.id}.${fileExt}`

  // ✅ UPLOAD IMAGE
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      upsert: true
    })

  if(uploadError){
  console.error(uploadError)
  alert(uploadError.message)
  return
}

  // ✅ GET PUBLIC URL
  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName)

  const avatarUrl = data.publicUrl

  // ✅ SAVE TO DATABASE
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      avatar_url: avatarUrl
    })
    .eq("id", user.id)

  if(updateError){
    console.error(updateError)
    alert(updateError.message)
    return
  }

  // ✅ UPDATE UI
  setProfile(prev => ({
    ...prev,
    avatar_url: avatarUrl
  }))

  alert("Photo updated ✅")
}


// ✅ UPDATE PROFILE
async function updateProfile(e){

  e.preventDefault()

  if(!user) return

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      ...profile
    })

  if(error){
    console.error(error)
    alert("Failed to update profile")
    return
  }

  alert("Profile updated ✅")
}

  if(loading){
    return <div>Loading profile...</div>
  }

  return(
    <>
      <WorkerNavbar/>

      <div className="dashboard-container">

        <h1>Your Profile</h1>

        <div className="profile-layout">

          <div className="worker-profile-sidebar">

            {profile.avatar_url ? (
  <img
    src={profile.avatar_url}
    className="worker-avatar-img"
    alt="avatar"
    onError={(e)=>{
      e.target.onerror = null
      e.target.src =
        "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(profile.full_name || "U") +
        "&background=2563eb&color=fff&size=128"
    }}
  />
) : (
  <img
    src={
      "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(profile.full_name || "U") +
      "&background=2563eb&color=fff&size=128"
    }
    className="avatar-img"
    alt="avatar"
  />
)}

            <label className="upload-btn">
              Change Photo
              <input type="file" onChange={uploadAvatar} hidden/>
            </label>

            <h3>{profile.full_name || "No Name"}</h3>

<p className="worker-headline">
  {profile.headline || "No headline"}
</p>

<div className="worker-location">
  📍 {profile.location || "Location not set"}
</div>

<div className="availability-badge">
  🟢 {profile.availability || "Available"}
</div>

<div className="worker-phone">
  📞 {profile.phone || "No phone"}
</div>

            <p style={{ marginTop:"10px", fontWeight:"500" }}>
              ⭐ {avgRating} / 5 ({ratingCount})
            </p>

          </div>

          <form className="profile-card" onSubmit={updateProfile}>

            <div className="form-row">

              <div>
                <label>Full Name</label>
                <input
                  value={profile.full_name || ""}
                  onChange={(e)=>
                    setProfile({...profile,full_name:e.target.value})
                  }
                />
              </div>

              <div>
                <label>Location</label>
                <input
                  value={profile.location || ""}
                  onChange={(e)=>
                    setProfile({...profile,location:e.target.value})
                  }
                />
              </div>

            </div>

            <div className="form-row">

  <div>
    <label>Professional Headline</label>

    <input
      placeholder="e.g. Electrician"
      value={profile.headline || ""}
      onChange={(e)=>
        setProfile({
          ...profile,
          headline:e.target.value
        })
      }
    />
  </div>

  <div>
    <label>Phone Number</label>

    <input
      placeholder="08012345678"
      value={profile.phone || ""}
      onChange={(e)=>
        setProfile({
          ...profile,
          phone:e.target.value
        })
      }
    />
  </div>

</div>

<label>Availability</label>

<select
  value={profile.availability || "Available"}
  onChange={(e)=>
    setProfile({
      ...profile,
      availability:e.target.value
    })
  }
>

  <option>Available</option>
  <option>Busy</option>
  <option>Open to Remote Work</option>

</select>

            <label>Skills</label>
            <textarea
              value={profile.skills || ""}
              onChange={(e)=>
                setProfile({...profile,skills:e.target.value})
              }
            />

            <label>Experience</label>
            <textarea
              value={profile.experience || ""}
              onChange={(e)=>
                setProfile({...profile,experience:e.target.value})
              }
            />

            <button className="post-job-btn">
              Save Profile
            </button>

          </form>

        </div>

      </div>
    </>
  )
}

export default WorkerProfile