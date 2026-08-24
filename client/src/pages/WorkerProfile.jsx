import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import AppNavbar from "../components/AppNavbar"
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
  bio:"",
  resume_url:"",
  avatar_url:""
})

  const [avgRating,setAvgRating] = useState(0)
  const [ratingCount,setRatingCount] = useState(0)
  const [rating,setRating] = useState(0)
  const [review,setReview] = useState("")

  const [loading,setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState("")
  const [showImageModal, setShowImageModal] = useState(false)

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

    const { data } = await supabase
  .from("users")
  .select("*")
  .eq("id", userId)
  .maybeSingle()

    if(data){
      setProfile(data)
    } else {

  setProfile(prev => ({
    ...prev,
    id: userId
  }))
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

  if(file){

  const localPreview = URL.createObjectURL(file)

  setPreviewImage(localPreview)

  setProfile(prev => ({
    ...prev,
    avatar_url: localPreview
  }))
}

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

  await supabase
  .from("users")
  .update({
    avatar_url: avatarUrl
  })
  .eq("id", user.id)

  // ✅ SAVE TO DATABASE
  const { error: updateError } = await supabase
    .from("users")
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

async function uploadResume(e) {

  const file = e.target.files[0]

  if (!file || !user) return

  const fileExt = file.name.split(".").pop()

  const fileName = `${user.id}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(fileName, file, {
      upsert: true
    })

  if (uploadError) {
    alert(uploadError.message)
    return
  }

  const { data } = supabase.storage
    .from("resumes")
    .getPublicUrl(fileName)

  const { error } = await supabase
    .from("users")
    .update({
      resume_url: data.publicUrl
    })
    .eq("id", user.id)

  if (error) {
    alert(error.message)
    return
  }

  setProfile(prev => ({
    ...prev,
    resume_url: data.publicUrl
  }))

  alert("Resume uploaded successfully ✅")
}


// ✅ UPDATE PROFILE
async function updateProfile(e){

  e.preventDefault()

  if(!user) return

  const { error } = await supabase
  .from("users")
  .update({
    ...profile
  })
  .eq("id", user.id)

if(error){
  console.error(error)
  alert("Failed to update profile")
  return
}

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
      <AppNavbar />

      <div className="worker-profile-page">

        <h1>Your Profile</h1>

        <div className="worker-profile-layout">

          <div className="worker-profile-sidebar-card">

            {profile.avatar_url ? (
  <img
    src={profile.avatar_url}
    className="worker-profile-avatar"
onClick={() => setShowImageModal(true)}
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
    className="worker-profile-avatar"
onClick={() => setShowImageModal(true)}
    alt="avatar"
  />
)}

            <label
  htmlFor="worker-avatar-upload"
  className="worker-profile-upload-btn"
>
  Change Photo
</label>

<input
  id="worker-avatar-upload"
  type="file"
  accept="image/*"
  onChange={uploadAvatar}
  hidden
/>

            <h3>{profile.full_name || "No Name"}</h3>

<p className="worker-profile-headline">
  {profile.headline || "No headline"}
</p>

<div className="worker-profile-location">
  📍 {profile.location || "Location not set"}
</div>

<div className="worker-profile-availability">
  🟢 {profile.availability || "Available"}
</div>

<div className="worker-profile-phone">
  📞 {profile.phone || "No phone"}
</div>

<div className="worker-profile-bio">

  <h4>About Me</h4>

  <p>
    {profile.bio || "No bio yet."}
  </p>

</div>

            <div className="worker-profile-rating">
  <h4>⭐ Rating</h4>
  <span>{avgRating} / 5</span>
  <p>{ratingCount} Reviews</p>
</div>

          </div>

          {showImageModal && (

  <div
    className="worker-profile-image-modal"
    onClick={() => setShowImageModal(false)}
  >

    <button
      className="worker-profile-image-close"
      onClick={() => setShowImageModal(false)}
    >
      ✕
    </button>

    <img
      src={profile.avatar_url}
      alt="preview"
      className="worker-profile-image-preview"
      onClick={(e) => e.stopPropagation()}
    />

  </div>

)}

          <form className="worker-profile-form-card" onSubmit={updateProfile}>

            <div className="worker-profile-form-row">

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

            <div className="worker-profile-form-row">

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

            <label>Bio</label>

<textarea
  rows={5}
  placeholder="Tell employers about yourself..."
  value={profile.bio || ""}
  onChange={(e)=>
    setProfile({
      ...profile,
      bio:e.target.value
    })
  }
/>

<label>Resume</label>

<div className="resume-section">

  <label
    htmlFor="resume-upload"
    className="resume-upload-btn"
  >
    📄 Upload Resume
  </label>

  <input
    id="resume-upload"
    type="file"
    accept=".pdf,.doc,.docx"
    hidden
    onChange={uploadResume}
  />

  {profile.resume_url ? (
  <>
    <span className="resume-status">
      ✅ Resume Uploaded
    </span>

    <a
      href={profile.resume_url}
      target="_blank"
      rel="noopener noreferrer"
      className="resume-view-btn"
    >
      👁 View Resume
    </a>
  </>
) : (
  <span className="resume-status">
    ❌ No Resume Uploaded
  </span>
)}

</div>


            <button className="worker-profile-save-btn">
              Save Profile
            </button>

          </form>

        </div>

      </div>
    </>
  )
}

export default WorkerProfile