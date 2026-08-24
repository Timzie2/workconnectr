import supabase from "../supabaseClient"

function MessageMenu({

  menuPosition,

  selectedMessage,

  setReplyingTo,

  setShowMessageMenu,

  setReactionPickerFor,

  userId,

  fetchMessages,

  conversationId,

  setMessages

}) {

  return (

    <div
      className="message-options-menu"

      style={{

        top:
          window.innerHeight -
            menuPosition.y < 320

            ? menuPosition.y - 260

            : menuPosition.y,

        left:
          window.innerWidth -
            menuPosition.x < 240

            ? menuPosition.x - 220

            : menuPosition.x

      }}
    >

    <button
  onClick={() => {

    setReplyingTo(selectedMessage)

    setShowMessageMenu(false)

  }}
>
  Reply
</button>

    <button
      onClick={() => {

        navigator.clipboard.writeText(
          selectedMessage?.message || ""
        )

        setShowMessageMenu(false)

      }}
    >
      Copy
    </button>

    <button
  onClick={(e) => {

  e.stopPropagation()

  setReactionPickerFor(selectedMessage.id)

  setShowMessageMenu(false)

}}
>
  React
</button>

    <button
  onClick={async () => {

  console.log("DELETE FOR ME CLICKED")

  const updatedDeletedBy = [
    ...(selectedMessage.deleted_by || []),
    userId
  ]

  const { data, error } = await supabase
    .from("messages")
    .update({
      deleted_by: updatedDeletedBy
    })
    .eq("id", selectedMessage.id)
    .select()

  console.log(data)
  console.log(error)

  await fetchMessages(conversationId)

  setShowMessageMenu(false)

}}
>

  Delete For Me

</button>

{selectedMessage?.sender_id === userId && (

  <button
  onClick={async () => {

    const confirmDelete =
      window.confirm(
        "Delete for everyone?"
      )

    if (!confirmDelete) return

    const { error } = await supabase
  .from("messages")
  .delete()
  .eq("id", selectedMessage.id)

setMessages(prev =>

  prev.filter(
    msg => msg.id !== selectedMessage.id
  )

)

await fetchMessages(conversationId)

const { data: latestMessage } =
  await supabase
    .from("messages")
    .select("message, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", {
      ascending: false
    })
    .limit(1)
    .single()

await supabase
  .from("conversations")
  .update({
    last_message:
      latestMessage?.message || "",
    last_message_time:
      latestMessage?.created_at || null
  })
  .eq("id", conversationId)

    if (error) {
      console.error(error)
      return
    }

    setMessages(prev =>

      prev.filter(
        m => m.id !== selectedMessage.id
      )

    )

    setShowMessageMenu(false)

  }}
>

  Delete For All

</button>

)}

    <button
      onClick={() => {

        setShowMessageMenu(false)

      }}
    >
      Cancel
    </button>

    </div>

  )

}

export default MessageMenu