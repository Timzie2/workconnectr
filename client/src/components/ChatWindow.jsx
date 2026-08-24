import {
  useEffect,
  useRef,
  useState
} from "react"

import { useNavigate } from "react-router-dom"
import supabase from "../supabaseClient"
import MessageBubble from "./MessageBubble"
import ChatInput from "./ChatInput"
import ImageViewer from "./ImageViewer"
import CameraModal from "./CameraModal"
import MessageMenu from "./MessageMenu"
import MediaViewer from "./MediaViewer"
import UploadPreviewModal from "./UploadPreviewModal"

import { useAuth } from "../context/AuthContext"
import "../styles/Messages.css"
import EmojiPicker from "emoji-picker-react"
import {
  FiFile,
  FiFileText,
  FiMusic,
  FiVideo,
  FiImage,
  FiArchive
} from "react-icons/fi"

function ChatWindow({ conversationId }) {

  const {
  user,
  role: userRole
} = useAuth()

  const userId = user?.id

  const navigate = useNavigate()
  
  const [messages, setMessages] = useState([])

  const [text, setText] = useState("")

  const [receiver, setReceiver] =
    useState(null)

  const [receiverId, setReceiverId] =
  useState(null)

  const [isTyping, setIsTyping] =
  useState(false)

  const bottomRef = useRef(null)

  const typingChannelRef = useRef(null)

  const typingTimeoutRef = useRef(null)

  const [selectedImage, setSelectedImage] =
  useState(null)

  const [imagePreview, setImagePreview] =
  useState("")

  const [imageCaption, setImageCaption] =
  useState("")

  const [showEmojiPicker, setShowEmojiPicker] =
  useState(false)

  const inputRef = useRef(null)

  const [viewImage, setViewImage] =
  useState("")
  
  const [showImageViewer, setShowImageViewer] =
  useState(false)

  const [showMenu, setShowMenu] =
  useState(false)

  const [selectedMessage, setSelectedMessage] =
  useState(null)
  
  const [showMessageMenu, setShowMessageMenu] =
  useState(false)
  
  const [menuPosition, setMenuPosition] =
  useState({
    x: 0,
    y: 0
  })

  const [hoveredMessage, setHoveredMessage] =
  useState(null)

  const [replyingTo, setReplyingTo] =
  useState(null)

  const [
  reactionPickerFor, setReactionPickerFor] = 
  useState(null)

  const [showAttachMenu, setShowAttachMenu] =
  useState(false)

  const [showCamera, setShowCamera] =
  useState(false)
  
  const [cameraStream, setCameraStream] =
  useState(null)

  const videoRef = useRef(null)
  
  const canvasRef = useRef(null)

  const fileInputRef = useRef(null)

  const isVisibleToMe = (msg) =>

  !msg.deleted_by?.includes(userId)

  const [uploading, setUploading] =
  useState(false)
  
  const [uploadProgress, setUploadProgress] =
  useState(0)

  const [selectedVideo, setSelectedVideo] =
  useState(null)

  const [videoPreview, setVideoPreview] =
  useState("")

  const [selectedDocument, setSelectedDocument] =
  useState(null)
  
  const [documentPreview, setDocumentPreview] =
  useState(null)

  const [recording, setRecording] =
  useState(false)
  
  const [audioBlob, setAudioBlob] =
  useState(null)
  
  const [audioPreview, setAudioPreview] =
  useState("")
  
  const mediaRecorderRef = useRef(null)
  
  const audioChunksRef = useRef([])

  const [zoomLevel, setZoomLevel] =
  useState(1)

  const [currentImageIndex,
    setCurrentImageIndex] =
    useState(0)

  const [showMediaViewer, setShowMediaViewer] =
  useState(false)
  
  const [mediaTab, setMediaTab] =
  useState("media")

  // LOAD CHAT

  useEffect(() => {

  if (!userId || !conversationId) return

  let cleanup

  const setupChat = async () => {

    cleanup = await loadConversation()

  }

  setupChat()

  return () => {

    if (cleanup) cleanup()

  }

}, [userId, conversationId])

  // AUTO SCROLL

  useEffect(() => {

  bottomRef.current?.scrollIntoView({
    behavior: "smooth"
  })

}, [messages, isTyping])

  // REALTIME USER STATUS

useEffect(() => {

  if (!receiverId) return

  const statusChannel = supabase
    .channel(`status-${receiverId}`)

    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "users",
        filter: `id=eq.${receiverId}`
      },

      (payload) => {

        console.log(
          "STATUS UPDATED:",
          payload.new
        )

        console.log(
  "ONLINE STATUS:",
  payload.new.is_online
)

        setReceiver(prev => ({
  ...prev,
  is_online: payload.new.is_online,
  last_seen: payload.new.last_seen,
  last_active: payload.new.last_active
}))
      }
    )

    .subscribe()

  return () => {
    supabase.removeChannel(statusChannel)
  }

}, [receiverId])

// TYPING STATUS

useEffect(() => {

  if (!conversationId) return

  const typingChannel = supabase.channel(
  "typing-global"
)

typingChannelRef.current =
  typingChannel

  typingChannel.on(
    "broadcast",
    { event: "typing" },

    ({ payload }) => {

      if (payload.userId !== userId) {

        setIsTyping(payload.isTyping)

      }

    }
  )

  typingChannel.subscribe()

  return () => {
    supabase.removeChannel(typingChannel)
  }

}, [conversationId])

// MARK AS SEEN

useEffect(() => {

  if (!userId || !receiverId) return

 const markSeen = async () => {

  // MARK MESSAGES READ

  await supabase
    .from("messages")
    .update({
      is_read: true
    })
    .eq("receiver_id", userId)
    .eq("sender_id", receiverId)
    .eq("is_read", false)

    // MARK CONVERSATION PREVIEW READ

  await supabase
  .from("conversations")
  .update({
    last_message_read: true
  })
  .eq("id", conversationId)
  .neq("last_message_sender_id", userId)

  // MARK NOTIFICATIONS SEEN

  await supabase

    .from("notifications")

    .update({
      is_seen: true
    })

    .eq("user_id", userId)

    .eq("sender_id", receiverId)

    .eq("type", "message")

    .eq("is_seen", false)

}

  const timer = setTimeout(() => {

    markSeen()

  }, 2000)

  return () => clearTimeout(timer)

}, [messages])

useEffect(() => {

  const handleClickOutside = (e) => {

    if (
      !e.target.closest(".emoji-wrapper")
    ) {

      setShowEmojiPicker(false)

    }

  }

  document.addEventListener(
    "mousedown",
    handleClickOutside
  )

  return () => {

    document.removeEventListener(
      "mousedown",
      handleClickOutside
    )

  }

}, [])

useEffect(() => {

  const handleMenuOutside = (e) => {

    if (
      !e.target.closest(
        ".chat-menu-wrapper"
      )
    ) {

      setShowMenu(false)

    }

  }

  document.addEventListener(
    "mousedown",
    handleMenuOutside
  )

  return () => {

    document.removeEventListener(
      "mousedown",
      handleMenuOutside
    )

  }

}, [])

useEffect(() => {

  const closeMessageMenu = () => {

    setShowMessageMenu(false)

  }

  window.addEventListener(
    "click",
    closeMessageMenu
  )

  return () => {

    window.removeEventListener(
      "click",
      closeMessageMenu
    )

  }

}, [])

useEffect(() => {

  const closeReactionPicker = () => {

    setReactionPickerFor(null)

  }

  window.addEventListener(
    "click",
    closeReactionPicker
  )

  return () => {

    window.removeEventListener(
      "click",
      closeReactionPicker
    )

  }

}, [])

useEffect(() => {

  const handleAttachOutside = (e) => {

    if (
      !e.target.closest(
        ".attach-menu-wrapper"
      )
    ) {

      setShowAttachMenu(false)

    }

  }

  document.addEventListener(
    "mousedown",
    handleAttachOutside
  )

  return () => {

    document.removeEventListener(
      "mousedown",
      handleAttachOutside
    )

  }

}, [])

const loadConversation = async () => {

  const { data: convo, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle()

  if (error) {

    console.error(error)

    return

  }

  if (!convo) {

    navigate("/messages")

    return

  }

  const otherUserId =
    convo.user_one === userId
      ? convo.user_two
      : convo.user_one

      console.log("CONVO:", convo)

console.log(
  "OTHER USER ID:",
  otherUserId
)

  setReceiverId(otherUserId)

  const { data: otherUser } = await supabase
  .from("users")
  .select(`
    id,
    role,
    full_name,
    company_name,
    avatar_url,
    is_online,
    last_seen,
    last_active
  `)
  .eq("id", otherUserId)
  .single()

console.log("CONVO:", convo)

console.log("OTHER USER ID:", otherUserId)

console.log("OTHER USER:", otherUser)

setReceiver(otherUser || {
  full_name: "Deleted User"
})

  fetchMessages(conversationId)

  const channel = supabase
    .channel(`chat-${conversationId}`)

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`
      },
      () => {
        fetchMessages(conversationId)
      }
    )

    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }

}

  // RECEIVER

  const fetchReceiver = async () => {

    const { data } = await supabase
      .from("users")
      .select(`
  id,
  role,
  full_name,
  company_name,
  avatar_url,
  is_online,
  last_seen,
  last_active
`)
      .eq("id", receiverId)
      .single()

    if (data) {
      setReceiver(data)
    }
  }

  // CONVERSATION

  const fetchOrCreateConversation =
  async () => {

      const { data: existingConversations } =
        await supabase
          .from("conversations")
          .select("*")
          .or(`user_one.eq.${userId},user_two.eq.${userId}`)

      const existing =
        existingConversations?.find(
          (conversation) =>

            (
              conversation.user_one === userId &&
              conversation.user_two === receiverId
            )

            ||

            (
              conversation.user_one === receiverId &&
              conversation.user_two === userId
            )
        )

      let convoId = existing?.id

      // CREATE

      if (!convoId) {

        const {
          data: newConversation,
          error
        } = await supabase
          .from("conversations")
          .insert({
            user_one: userId,
            user_two: receiverId
          })
          .select()
          .single()

        if (error) {
          console.error(error)
          return
        }

        convoId = newConversation.id
      }

      fetchMessages(convoId)

      // REALTIME

      const channel = supabase
  .channel(`chat-${convoId}`)

  // NEW MESSAGE

  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter:
        `conversation_id=eq.${convoId}`
    },

    (payload) => {

      console.log("NEW MESSAGE:", payload)

      const msg = payload.new

      setMessages(prev => {

        const exists = prev.some(
          m => m.id === msg.id
        )

        if (exists) return prev

        if (!isVisibleToMe(msg)) {

  return prev

}

return [...prev, msg]

      })

    }
  )

  // MESSAGE STATUS UPDATE

  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "messages",
      filter:
        `conversation_id=eq.${convoId}`
    },

    (payload) => {

      console.log(
        "MESSAGE UPDATED:",
        payload
      )

      const updated = payload.new

      setMessages(prev => {

  const updatedList = prev.map(msg =>

    msg.id === updated.id

      ? {
          ...msg,
          ...updated
        }

      : msg

  )

  return updatedList.filter(isVisibleToMe)

})

    }
  )

  .on(
  "postgres_changes",
  {
    event: "DELETE",
    schema: "public",
    table: "messages",
    filter:
      `conversation_id=eq.${convoId}`
  },

  (payload) => {

    const deletedMessageId =
      payload.old.id

    setMessages(prev =>

      prev.filter(
        msg => msg.id !== deletedMessageId
      )

    )

  }
)

.subscribe()

        console.log("Realtime connected")

      return () => {
        supabase.removeChannel(channel)
      }
    }

  // FETCH MESSAGES

  const fetchMessages = async (
    convoId
  ) => {

    const { data, error } =
      await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convoId)
        .order("created_at", {
          ascending: true
        })

    if (!error) {
      const filteredMessages =
  (data || []).filter(isVisibleToMe)

setMessages(filteredMessages)
    }

    
  }

  const getFileIcon = (
  fileName = ""
) => {

  const extension =
    fileName
      .split(".")
      .pop()
      ?.toLowerCase()

  switch (extension) {

    case "pdf":
      return <FiFileText />

    case "doc":
    case "docx":
      return <FiFileText />

    case "xls":
    case "xlsx":
      return <FiFileText />

    case "ppt":
    case "pptx":
      return <FiFileText />

    case "zip":
    case "rar":
      return <FiArchive />

    case "mp3":
    case "wav":
      return <FiMusic />

    case "mp4":
    case "mov":
    case "avi":
      return <FiVideo />

    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
      return <FiImage />

    default:
      return <FiFile />

  }

}

  const handleFileUpload = async (e) => {

  const file = e.target.files[0]

  if (!file) return

  setUploading(true)
  setUploadProgress(0)
  setShowAttachMenu(false)

  let progress = 0

const fakeProgress = setInterval(() => {

  progress += 10

  if (progress <= 90) {

    setUploadProgress(progress)

  }

}, 200)

const fileType = file.type

let maxSize = 20 * 1024 * 1024 // DEFAULT 20MB

// IMAGES

if (fileType.startsWith("image/")) {

  maxSize = 10 * 1024 * 1024

}

// VIDEOS

else if (
  fileType.startsWith("video/")
) {

  maxSize = 100 * 1024 * 1024

}

// DOCUMENTS / OTHER FILES

else {

  maxSize = 20 * 1024 * 1024

}

// CHECK SIZE

if (file.size > maxSize) {

  const sizeInMB =
    Math.round(
      maxSize / 1024 / 1024
    )

  alert(
    `File must be under ${sizeInMB}MB`
  )

  return

}

  const fileName =
    `${Date.now()}-${file.name}`

  // UPLOAD FILE

  const { error: uploadError } =
    await supabase.storage

      .from("chat-files")

      .upload(fileName, file)

  if (uploadError) {

  clearInterval(fakeProgress)

  setUploading(false)

  setUploadProgress(0)

  console.error(uploadError)

  return

}

  // GET PUBLIC URL

  const { data } = supabase.storage

    .from("chat-files")

    .getPublicUrl(fileName)

    clearInterval(fakeProgress)

setUploadProgress(100)

  // SEND MESSAGE

  const { error } = await supabase

    .from("messages")

    .insert({

  conversation_id:
    conversationId,

  sender_id:userId,

  receiver_id:receiverId,

  ...(fileType.startsWith("audio/")

    ? {

        audio_url:
          data.publicUrl

      }

    : {

        file_url:
          data.publicUrl

      }),

  file_name:file.name,

  is_read:false

})

  if (error) {

    console.error(error)

  }

  setTimeout(() => {

  setUploading(false)

  setUploadProgress(0)

}, 500)

}

const handleVideoUpload = (e) => {

  const file = e.target.files[0]

  if (!file) return

  const maxSize =
    100 * 1024 * 1024

  if (file.size > maxSize) {

    alert(
      "Video must be under 100MB"
    )

    return

  }

  setSelectedVideo(file)

  setVideoPreview(
    URL.createObjectURL(file)
  )

  setShowAttachMenu(false)

}

  const handleImageUpload = (
  e
) => {

  const file = e.target.files[0]

  if (!file) return

  setSelectedImage(file)

  setImagePreview(
    URL.createObjectURL(file)
  )

  setShowAttachMenu(false)

}

const handleDocumentUpload = (e) => {

  const file = e.target.files[0]

  if (!file) return

  const maxSize =
    20 * 1024 * 1024

  if (file.size > maxSize) {

    alert(
      "Document must be under 20MB"
    )

    return

  }

  setSelectedDocument(file)

  setDocumentPreview({

    name: file.name,

    size: (
      file.size / 1024 / 1024
    ).toFixed(2)

  })

  setShowAttachMenu(false)

}

const sendImage = async () => {

  if (!selectedImage) return

  setUploading(true)
  setUploadProgress(0)

  let progress = 0

const fakeProgress = setInterval(() => {

  progress += 10

  if (progress <= 90) {

    setUploadProgress(progress)

  }

}, 200)

  const fileName =
    `${Date.now()}-${selectedImage.name}`

  // UPLOAD

  const { error: uploadError } =
    await supabase.storage

      .from("chat-files")

      .upload(fileName, selectedImage)

  if (uploadError) {

    clearInterval(fakeProgress)

setUploading(false)

setUploadProgress(0)

console.error(uploadError)

return
  }

  // GET URL

  const { data } = supabase.storage

    .from("chat-files")

    .getPublicUrl(fileName)

    clearInterval(fakeProgress)

setUploadProgress(100)

  // SAVE MESSAGE

  const { error } = await supabase

    .from("messages")

    .insert({

      conversation_id:
        conversationId,

      sender_id: userId,

      receiver_id: receiverId,

      image_url:
        data.publicUrl,

      message: imageCaption,

      is_read: false

    })

    await supabase
  .from("conversations")
  .update({

    last_message: "📷 Image",

    last_message_time:
      new Date().toISOString(),

    last_message_sender_id: userId,
    last_message_read: false

  })
  .eq("id", conversationId)

  if (error) {
    console.error(error)
  }

  // RESET

  setSelectedImage(null)
  setImagePreview("")
  setImageCaption("")

  setTimeout(() => {

  setUploading(false)

  setUploadProgress(0)

}, 500)
  
}

const sendVideo = async () => {

  if (!selectedVideo) return

  setUploading(true)

  setUploadProgress(0)

  let progress = 0

  const fakeProgress = setInterval(() => {

    progress += 10

    if (progress <= 90) {

      setUploadProgress(progress)

    }

  }, 200)

  const fileName =
    `${Date.now()}-${selectedVideo.name}`

  // UPLOAD

  const { error: uploadError } =
    await supabase.storage

      .from("chat-files")

      .upload(fileName, selectedVideo)

  if (uploadError) {

    clearInterval(fakeProgress)

    setUploading(false)

    setUploadProgress(0)

    console.error(uploadError)

    return

  }

  // URL

  const { data } = supabase.storage

    .from("chat-files")

    .getPublicUrl(fileName)

  clearInterval(fakeProgress)

  setUploadProgress(100)

  // SAVE MESSAGE

  const { error } = await supabase

    .from("messages")

    .insert({

      conversation_id:
        conversationId,

      sender_id: userId,

      receiver_id: receiverId,

      video_url:
        data.publicUrl,

      file_name:
        selectedVideo.name,

      is_read: false

    })

    await supabase
  .from("conversations")
  .update({

    last_message: "🎥 Video",

    last_message_time:
      new Date().toISOString(),

    last_message_sender_id: userId,
    last_message_read: false

  })
  .eq("id", conversationId)

  if (error) {

    console.error(error)

  }

  // RESET

  setSelectedVideo(null)

  setVideoPreview("")

  setTimeout(() => {

    setUploading(false)

    setUploadProgress(0)

  }, 500)

}

const sendVoiceNote = async () => {

  if (!audioBlob) return

  setUploading(true)

  setUploadProgress(0)

  let progress = 0

  const fakeProgress = setInterval(() => {

    progress += 10

    if (progress <= 90) {

      setUploadProgress(progress)

    }

  }, 200)

  const fileName =
    `voice-${Date.now()}.webm`

  // UPLOAD

  const { error: uploadError } =
    await supabase.storage

      .from("chat-files")

      .upload(fileName, audioBlob)

  if (uploadError) {

    clearInterval(fakeProgress)

    setUploading(false)

    setUploadProgress(0)

    console.error(uploadError)

    return

  }

  // URL

  const { data } = supabase.storage

    .from("chat-files")

    .getPublicUrl(fileName)

  clearInterval(fakeProgress)

  setUploadProgress(100)

  // SAVE

  const { error } = await supabase

    .from("messages")

    .insert({

      conversation_id:
        conversationId,

      sender_id:userId,

      receiver_id:receiverId,

      audio_url:
        data.publicUrl,

      is_read:false

    })

  if (error) {

    console.error(error)

  }

  await supabase
  .from("conversations")
  .update({

    last_message: "🎤 Voice note",

    last_message_time:
      new Date().toISOString(),

    last_message_sender_id: userId,
    last_message_read: false

  })
  .eq("id", conversationId)

  // RESET

  setAudioBlob(null)

  setAudioPreview("")

  setTimeout(() => {

    setUploading(false)

    setUploadProgress(0)

  }, 500)

}

const sendDocument = async () => {

  if (!selectedDocument) return

  setUploading(true)

  setUploadProgress(0)

  let progress = 0

  const fakeProgress = setInterval(() => {

    progress += 10

    if (progress <= 90) {

      setUploadProgress(progress)

    }

  }, 200)

  const fileName =
    `${Date.now()}-${selectedDocument.name}`

  // UPLOAD

  const { error: uploadError } =
    await supabase.storage

      .from("chat-files")

      .upload(fileName, selectedDocument)

  if (uploadError) {

    clearInterval(fakeProgress)

    setUploading(false)

    setUploadProgress(0)

    console.error(uploadError)

    return

  }

  // URL

  const { data } = supabase.storage

    .from("chat-files")

    .getPublicUrl(fileName)

  clearInterval(fakeProgress)

  setUploadProgress(100)

  // SAVE MESSAGE

  const { error } = await supabase

    .from("messages")

    .insert({

      conversation_id:
        conversationId,

      sender_id: userId,

      receiver_id: receiverId,

      file_url:
        data.publicUrl,

      file_name:
        selectedDocument.name,

      is_read:false

    })

    await supabase
  .from("conversations")
  .update({

    last_message: "📎 File",

    last_message_time:
      new Date().toISOString(),

    last_message_sender_id: userId,
    last_message_read: false

  })
  .eq("id", conversationId)

  if (error) {

    console.error(error)

  }

  // RESET

  setSelectedDocument(null)

  setDocumentPreview(null)

  setTimeout(() => {

    setUploading(false)

    setUploadProgress(0)

  }, 500)

}

const handleEmojiClick = (emojiData) => {

  setText(prev =>
    prev + emojiData.emoji
  )

  inputRef.current?.focus()

}

const deleteConversation = async () => {

  const confirmDelete =
    window.confirm(
      "Delete this chat for you?"
    )

  if (!confirmDelete) return

  try {

    // GET CONVERSATION

    const { data: convo } =
      await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single()

    if (!convo) return

    // USER ONE

    if (convo.user_one === userId) {

      // HIDE CHAT

      await supabase
        .from("conversations")
        .update({
          hidden_by_user_one: true
        })
        .eq("id", conversationId)

      // DELETE MESSAGES FOR USER ONE

      const { data: allMessages } =
  await supabase
    .from("messages")
    .select("id, deleted_by")
    .eq(
      "conversation_id",
      conversationId
    )

await Promise.all(

  allMessages.map(msg =>

    supabase
      .from("messages")
      .update({

        deleted_by: [

          ...(msg.deleted_by || []),

          userId

        ]

      })
      .eq("id", msg.id)

  )

)

await fetchMessages(conversationId)

    }

    // USER TWO

    else if (
      convo.user_two === userId
    ) {

      // HIDE CHAT

      await supabase
        .from("conversations")
        .update({
          hidden_by_user_two: true
        })
        .eq("id", conversationId)

      // DELETE MESSAGES FOR USER TWO

      const { data: allMessages } =
  await supabase
    .from("messages")
    .select("id, deleted_by")
    .eq(
      "conversation_id",
      conversationId
    )

await Promise.all(

  allMessages.map(msg =>

    supabase
      .from("messages")
      .update({

        deleted_by: [

          ...(msg.deleted_by || []),

          userId

        ]

      })
      .eq("id", msg.id)

  )

)

await fetchMessages(conversationId)

    }

    setMessages([])

setShowMenu(false)

navigate("/messages")

  } catch (err) {

    console.error(err)

    alert("Failed to delete chat")

  }

}

const clearMessages = async () => {

  const confirmClear =
    window.confirm(
      "Clear all messages?"
    )

  if (!confirmClear) return

  await supabase
    .from("messages")
    .delete()
    .eq(
      "conversation_id",
      conversationId
    )

    await supabase
  .from("conversations")
  .update({
    last_message: "",
    last_message_time: null,
    last_message_sender_id: null
  })
  .eq("id", conversationId)

  setMessages([])

  setShowMenu(false)

}

const viewProfile = () => {

  if (!receiverId || !receiver) return

  setShowMenu(false)

  navigate(`/${receiver.role}/${receiverId}`)

}

const startRecording = async () => {

  try {

    const stream =
      await navigator.mediaDevices
        .getUserMedia({
          audio:true
        })

    const mediaRecorder =
      new MediaRecorder(stream)

    mediaRecorderRef.current =
      mediaRecorder

    audioChunksRef.current = []

    mediaRecorder.ondataavailable =
      (event) => {

        if (
          event.data.size > 0
        ) {

          audioChunksRef.current.push(
            event.data
          )

        }

      }

    mediaRecorder.onstop = () => {

      const audioBlob =
        new Blob(
          audioChunksRef.current,
          {
            type:"audio/webm"
          }
        )

      setAudioBlob(audioBlob)

      setAudioPreview(
        URL.createObjectURL(audioBlob)
      )

      stream.getTracks()
        .forEach(track =>
          track.stop()
        )

    }

    mediaRecorder.start()

    setRecording(true)

  } catch (err) {

    console.error(err)

    alert(
      "Microphone access denied"
    )

  }

}

const stopRecording = () => {

  mediaRecorderRef.current?.stop()

  setRecording(false)

}

const openCamera = async () => {

  try {

    const stream =
      await navigator.mediaDevices
        .getUserMedia({
          video: true
        })

    setCameraStream(stream)

    setShowCamera(true)
    setShowAttachMenu(false)

    setTimeout(() => {

      if (videoRef.current) {

        videoRef.current.srcObject =
          stream

      }

    }, 100)

  } catch (err) {

    console.error(err)

    alert("Camera access denied")

  }

}

const capturePhoto = async () => {

  const video = videoRef.current

  const canvas = canvasRef.current

  const context =
    canvas.getContext("2d")

  canvas.width = video.videoWidth

  canvas.height = video.videoHeight

  context.drawImage(
    video,
    0,
    0
  )

  canvas.toBlob(async (blob) => {

    const file = new File(
      [blob],
      `camera-${Date.now()}.png`,
      {
        type:"image/png"
      }
    )

    setSelectedImage(file)

    setImagePreview(
      URL.createObjectURL(file)
    )

  })

  // STOP CAMERA

  cameraStream?.getTracks()
    .forEach(track =>
      track.stop()
    )

  setShowCamera(false)

}

  // SEND MESSAGE

  const sendMessage = async () => {

    if (!text.trim()) return

    const messageText = text

    setText("")

    typingChannelRef.current?.send({

  type: "broadcast",

  event: "typing",

  payload: {

    conversationId,

    userId,

    isTyping: false

  }

})

    const { error } = await supabase
      .from("messages")
      .insert({

  conversation_id: conversationId,

  sender_id: userId,

  receiver_id: receiverId,

  message: messageText,

  is_read: false,

  replied_message_id:
    replyingTo?.id || null,

  replied_text:
    replyingTo?.message || null,

  replied_sender:
    replyingTo?.sender_id === userId
      ? "You"
      : receiver?.full_name

})

    if (error) {
      console.error(error)
      return
    }
    setReplyingTo(null)

    await supabase
  .from("conversations")
  .update({
    hidden_by_user_one: false,
    hidden_by_user_two: false
  })
  .eq("id", conversationId)

    // UPDATE CONVERSATION

    await supabase
  .from("conversations")
  .update({
    last_message: messageText,
    last_message_time: new Date().toISOString(),
    last_message_sender_id: userId,
    last_message_read: false
  })
  .eq("id", conversationId)

    // NOTIFICATION

    const { data: existingNotification } =
  await supabase

    .from("notifications")

    .select("*")

    .eq("user_id", receiverId)

    .eq("sender_id", userId)

    .eq("type", "message")

    .eq("is_seen", false)

    .maybeSingle()

// UPDATE EXISTING

if (existingNotification) {

  await supabase

    .from("notifications")

    .update({

      message_count:
        existingNotification.message_count + 1,

      message:
        `${receiver?.full_name || "Someone"} sent you ${existingNotification.message_count + 1} messages`

    })

    .eq("id", existingNotification.id)

}

// CREATE NEW

else {

  await supabase

    .from("notifications")

    .insert({

      user_id: receiverId,

      sender_id: userId,

      type: "message",

      message_count: 1,

      message:
        `${receiver?.full_name || "Someone"} sent you a message`,

      is_seen: false

    })

}
  }

  // EMPTY STATE

if (!receiverId) {

  return (

    <div className="empty-chat-window">

      <div className="empty-chat-content">

        <div className="empty-chat-icon">
          💬
        </div>

        <h2>
          Welcome to Messages
        </h2>

       <p>
  {userRole === "worker"
    ? "Connect with contractors and start discussing jobs."
    : "Connect with workers and manage hiring conversations."
  }
</p>

<button className="empty-chat-btn">

  {userRole === "worker"
    ? "Find Contractors"
    : "Find Workers"
  }

</button>

      </div>

    </div>
  )
}

const mediaMessages = messages.filter(

  msg =>

    msg.image_url ||

    msg.video_url

)

const fileMessages = messages.filter(

  msg => msg.file_url

)

const audioMessages = messages.filter(

  msg => msg.audio_url

)

const imageMessages =
  mediaMessages.filter(
    msg => msg.image_url
  )

const showNextImage = () => {

  const nextIndex =

    currentImageIndex ===
    imageMessages.length - 1

      ? 0

      : currentImageIndex + 1

  setCurrentImageIndex(nextIndex)

  setViewImage(
    imageMessages[nextIndex]
      ?.image_url
  )

}

const showPrevImage = () => {

  const prevIndex =

    currentImageIndex === 0

      ? imageMessages.length - 1

      : currentImageIndex - 1

  setCurrentImageIndex(prevIndex)

  setViewImage(
    imageMessages[prevIndex]
      ?.image_url
  )

}

  return (

    <div className="chat-window">

      {/* HEADER */}

      <div className="chat-header">

  {/* MOBILE BACK */}

  <button
  className="mobile-back-btn"

  onClick={() => {

    window.scrollTo(0, 0)

    navigate("/messages", {
      replace: true
    })

  }}
>

  ←

</button>

  <div className="chat-header-user">

    <div className="chat-avatar-wrapper">

      <img
        src={
          receiver?.avatar_url ||
          "/default-avatar.png"
        }
        className="chat-header-avatar"
      />

      {receiver?.last_active &&
      Date.now() -
      new Date(
        receiver.last_active
      ).getTime()
      < 30000 && (
        <span className="chat-online-dot"></span>
      )}

    </div>

    <div>

      <h3>

        {userRole === "worker"

          ? (
              receiver?.company_name ||

              receiver?.full_name ||

              "User"
            )

          : (
              receiver?.full_name ||

              "User"
            )

        }

      </h3>

      <p>

        {isTyping

          ? "Typing..."

          : receiver?.last_active &&
            Date.now() -
            new Date(
              receiver.last_active
            ).getTime()
            < 30000

            ? "Active now"

            : receiver?.last_seen

              ? `Last seen ${new Date(
                  receiver.last_seen
                ).toLocaleString([], {
                  dateStyle:"short",
                  timeStyle:"short"
                })}`

              : "Offline"}

      </p>

    </div>

  </div>

  <div className="chat-menu-wrapper">

    <button
      className="chat-menu-btn"

      onClick={() =>
        setShowMenu(!showMenu)
      }
    >

      ⋮

    </button>

    {showMenu && (

      <div
        className="chat-dropdown-menu"

        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <button
          onClick={deleteConversation}
        >
          Delete Chat
        </button>

        <button
          onClick={viewProfile}
        >
          View Profile
        </button>

        <button
          onClick={() => {

            setShowMenu(false)

            setShowMediaViewer(true)

          }}
        >
          View Media
        </button>

      </div>

    )}

  </div>

</div>

      {/* MESSAGES */}

      <div className="chat-messages">

  {messages.map(msg => (

  <MessageBubble
    key={msg.id}
    msg={msg}
    userId={userId}

    hoveredMessage={hoveredMessage}
    setHoveredMessage={setHoveredMessage}

    selectedMessage={selectedMessage}
    setSelectedMessage={setSelectedMessage}

    setMenuPosition={setMenuPosition}
    setShowMessageMenu={setShowMessageMenu}

    reactionPickerFor={reactionPickerFor}
    setReactionPickerFor={setReactionPickerFor}

    mediaMessages={mediaMessages}

    setCurrentImageIndex={setCurrentImageIndex}
    setViewImage={setViewImage}
    setShowImageViewer={setShowImageViewer}

    setMessages={setMessages}

    getFileIcon={getFileIcon}
  />

))}

        {isTyping && (

  <div className="typing-message">

    <div className="typing-bubble">

      <span></span>
      <span></span>
      <span></span>

    </div>

  </div>

)}

        <div ref={bottomRef}></div>

      </div>

      <UploadPreviewModal

  imagePreview={imagePreview}
  imageCaption={imageCaption}
  setImageCaption={setImageCaption}
  setSelectedImage={setSelectedImage}
  setImagePreview={setImagePreview}
  sendImage={sendImage}

  videoPreview={videoPreview}
  setSelectedVideo={setSelectedVideo}
  setVideoPreview={setVideoPreview}
  sendVideo={sendVideo}

  documentPreview={documentPreview}
  setSelectedDocument={setSelectedDocument}
  setDocumentPreview={setDocumentPreview}
  sendDocument={sendDocument}

  audioPreview={audioPreview}
  setAudioBlob={setAudioBlob}
  setAudioPreview={setAudioPreview}
  sendVoiceNote={sendVoiceNote}

  getFileIcon={getFileIcon}

/>

{showMessageMenu && (

  <MessageMenu

    menuPosition={menuPosition}

    selectedMessage={selectedMessage}

    setReplyingTo={setReplyingTo}

    setShowMessageMenu={
      setShowMessageMenu
    }

    setReactionPickerFor={
      setReactionPickerFor
    }

    userId={userId}

    fetchMessages={fetchMessages}

    conversationId={
      conversationId
    }

    setMessages={setMessages}

  />

)}

{replyingTo && (

  <div className="reply-preview">

    <div className="reply-line"></div>

    <div className="reply-content">

      <small>
        Replying to
        {" "}
        {replyingTo.sender_id === userId
          ? "yourself"
          : receiver?.full_name}
      </small>

      <p>
        {replyingTo.message ||
          "Image"}
      </p>

    </div>

    <button
      className="cancel-reply-btn"

      onClick={() =>
        setReplyingTo(null)
      }
    >

      ✕

    </button>

  </div>

)}

{uploading && (

  <div className="upload-progress-bar">

    <div
      className="upload-progress-fill"

      style={{
        width: `${uploadProgress}%`
      }}
    />

  </div>

)}

      {/* INPUT */}

      <ChatInput
  text={text}
  setText={setText}
  sendMessage={sendMessage}
  inputRef={inputRef}

  showEmojiPicker={showEmojiPicker}
  setShowEmojiPicker={setShowEmojiPicker}

  showAttachMenu={showAttachMenu}
  setShowAttachMenu={setShowAttachMenu}

  recording={recording}
  startRecording={startRecording}
  stopRecording={stopRecording}

  handleEmojiClick={handleEmojiClick}
  handleImageUpload={handleImageUpload}
  handleDocumentUpload={handleDocumentUpload}
  handleVideoUpload={handleVideoUpload}
  openCamera={openCamera}

  typingChannelRef={typingChannelRef}
  typingTimeoutRef={typingTimeoutRef}

  userId={userId}
  conversationId={conversationId}
/>

      {showCamera && (

  <CameraModal

    videoRef={videoRef}
    canvasRef={canvasRef}

    capturePhoto={capturePhoto}

    cameraStream={cameraStream}

    setShowCamera={setShowCamera}

  />

)}

<MediaViewer

  showMediaViewer={showMediaViewer}
  setShowMediaViewer={setShowMediaViewer}

  mediaTab={mediaTab}
  setMediaTab={setMediaTab}

  mediaMessages={mediaMessages}
  fileMessages={fileMessages}
  audioMessages={audioMessages}

  getFileIcon={getFileIcon}

  setCurrentImageIndex={setCurrentImageIndex}
  setViewImage={setViewImage}
  setShowImageViewer={setShowImageViewer}

/>
{showImageViewer && (

  <ImageViewer

    viewImage={viewImage}

    zoomLevel={zoomLevel}
    setZoomLevel={setZoomLevel}

    setShowImageViewer={
      setShowImageViewer
    }

  />

)}

    </div>
  )
}

export default ChatWindow