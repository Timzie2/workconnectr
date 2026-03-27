import { useEffect, useState } from "react"
import supabase from "../supabaseClient"
import WorkerNavbar from "../components/WorkerNavbar"
import "./WorkerProfile.css"

function WorkerProfile(){

  const [user,setUser] = useState(null)

  const [profile,setProfile] = useState({
    full_name:"",
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

  useEffect(()=>{
    getUser()
  },[])

  async function getUser(){
    const { data: { user } } = await supabase.auth.getUser()

    if(!user){
      window.location.replace("/login")
      return
    }

    setUser(user)

    await fetchProfile(user.id)
    await fetchRating(user.id)

    setLoading(false)
  }

  // ✅ FETCH PROFILE (SAFE)
  async function fetchProfile(userId){

    const {data, error} = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if(data){
      setProfile(data)
    } else {
      // 🔥 AUTO CREATE PROFILE IF NOT EXISTS
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

    const {error} = await supabase.storage
      .from("avatars")
      .upload(fileName,file,{ upsert:true })

    if(error){
      alert("Upload failed")
      return
    }

    const {data} = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName)

    setProfile({
      ...profile,
      avatar_url:data.publicUrl
    })
  }

  // ✅ UPDATE PROFILE
  async function updateProfile(e){

    e.preventDefault()

    if(!user) return

    await supabase
      .from("profiles")
      .upsert({
        id:user.id,
        ...profile
      })

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

          {/* LEFT */}
          <div className="profile-avatar">

            {profile.avatar_url ? (
              <img src={profile.avatar_url} className="avatar-img"/>
            ):(
              <div className="avatar-circle">
                {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}

            <label className="upload-btn">
              Change Photo
              <input type="file" onChange={uploadAvatar} hidden/>
            </label>

            <h3>{profile.full_name || "No Name"}</h3>

            <p>{profile.location || "Location not set"}</p>

            {/* ⭐ RATING */}
            <p style={{ marginTop:"10px", fontWeight:"500" }}>
              ⭐ {avgRating} / 5 ({ratingCount})
            </p>

          </div>

          {/* RIGHT */}
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

            {/* ⭐ RATE USER */}
            <div className="rating-box" style={{marginTop:"30px"}}>

              <h3>Rate this User</h3>

              <div className="stars">
                {[1,2,3,4,5].map(num => (
                  <span
                    key={num}
                    onClick={()=>setRating(num)}
                    style={{
                      cursor:"pointer",
                      fontSize:"22px",
                      color:num <= rating ? "#facc15" : "#555"
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>

              <textarea
                placeholder="Write a review..."
                value={review}
                onChange={(e)=>setReview(e.target.value)}
              />

              <button
                type="button"
                onClick={submitRating}
                className="post-job-btn"
              >
                Submit Rating
              </button>

            </div>

          </form>

        </div>

      </div>
    </>
  )
}

export default WorkerProfile