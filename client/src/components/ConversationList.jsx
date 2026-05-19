import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import supabase from "../supabaseClient"
import { useAuth } from "../context/AuthContext"

import UserConversation from "./UserConversation"
import "../styles/Messages.css"

function ConversationList() {

  const {
  user,
  role: userRole
} = useAuth()

  const navigate = useNavigate()

  const { id } = useParams()

  const [conversations, setConversations] = useState([])

  const [typingUsers, setTypingUsers] =
  useState({})

  useEffect(() => {

  if (!user) return

  fetchConversations()

  const channel = supabase

  .channel("conversation-updates")

  // CONVERSATIONS

  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "conversations"
    },

    () => {
      fetchConversations()
    }
  )

  // MESSAGES

  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "messages"
    },

    () => {
      fetchConversations()
    }
  )

  .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }

}, [user])

useEffect(() => {

  const typingChannel =
  supabase.channel("typing-global")

  typingChannel.on(

    "broadcast",

    { event: "typing" },

    ({ payload }) => {

      setTypingUsers(prev => ({

        ...prev,

        [payload.conversationId]:
          payload.isTyping

      }))

    }

  )

  typingChannel.subscribe()

  return () => {
    supabase.removeChannel(
      typingChannel
    )
  }

}, [])

  const fetchConversations = async () => {

  const { data, error } = await supabase
  .from("conversations")
  .select("*")
  .or(`user_one.eq.${user.id},user_two.eq.${user.id}`)
  .order("last_message_time", {
    ascending: false
  })

  if (error) {
    console.error(error)
    return
  }

  if (!data) return

// HIDE REMOVED CHATS

const filteredConversations =
  data.filter(conversation => {

    // USER ONE

    if (
      conversation.user_one === user.id &&
      conversation.hidden_by_user_one
    ) {

      return false

    }

    // USER TWO

    if (
      conversation.user_two === user.id &&
      conversation.hidden_by_user_two
    ) {

      return false

    }

    return true

  })

const conversationsWithUsers =
  await Promise.all(

      filteredConversations.map(
  async (conversation) => {

        const otherUserId =
          conversation.user_one === user.id
            ? conversation.user_two
            : conversation.user_one

        const { data: otherUser } =
          await supabase
            .from("users")
            .select(`
  id,
  full_name,
  company_name,
  avatar_url
`)
            .eq("id", otherUserId)
            .single()

        const { count } = await supabase

  .from("messages")

  .select("*", {
    count: "exact",
    head: true
  })

  .eq("conversation_id", conversation.id)

  .eq("receiver_id", user.id)

  .eq("is_read", false)

const { data: latestVisibleMessage } =
  await supabase
    .from("messages")
    .select(`
  id,
  message,
  image_url,
  video_url,
  audio_url,
  file_url,
  deleted_by,
  created_at
`)
    .eq("conversation_id", conversation.id)
    .order("created_at", {
      ascending: false
    })
    .limit(20)

const visibleMessage =
  latestVisibleMessage?.find(
    msg =>
      !msg.deleted_by?.includes(user.id)
  )

  const displayName =

  userRole === "worker"

    ? (
        otherUser?.company_name ||

        otherUser?.full_name
      )

    : otherUser?.full_name

return {

  ...conversation,

  otherUser,

  displayName,

  unreadCount: count || 0,

  visibleLastMessage:

  visibleMessage?.message ||

  (
    visibleMessage?.image_url
      ? "📷 Image"

    : visibleMessage?.video_url
      ? "🎥 Video"

    : visibleMessage?.audio_url
      ? "🎤 Voice note"

    : visibleMessage?.file_url
      ? "📎 File"

    : "No messages yet"
  )

}

      })

    )

  setConversations(conversationsWithUsers)
}

  return (

    <div className="conversations-sidebar">

      {/* HEADER */}

      <div className="sidebar-header">

        <h2>Messages</h2>

      </div>

      {/* SEARCH */}

      <div className="conversation-search">

        <input
          type="text"
          placeholder="Search conversations..."
        />

      </div>

      {/* CONVERSATIONS */}

      <div className="conversation-list">

        {conversations.length === 0 ? (

          <p className="empty-conversations">
            No conversations yet
          </p>

        ) : (

          conversations.map((conversation) => {

            const otherUser = conversation.otherUser

            return (

              <UserConversation
  key={conversation.id}

  user={otherUser}

  displayName={
    conversation.displayName
  }

                lastMessage={
  typingUsers[conversation.id]

    ? "Typing..."

    : conversation.visibleLastMessage
}

                unreadCount={conversation.unreadCount}

                active={id === otherUser?.id}

                online={false}

                onClick={() =>
                  navigate(
                    `/messages/${otherUser?.id}`
                  )
                }
              />

            )
          })

        )}

      </div>

    </div>
  )
}

export default ConversationList