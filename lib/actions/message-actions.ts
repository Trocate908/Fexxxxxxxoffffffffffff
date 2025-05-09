"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getConversations() {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return {
      error: "Not authenticated",
    }
  }

  const userId = session.user.id

  // Get all conversations the user is part of
  const { data: participations, error: participationsError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId)

  if (participationsError) {
    console.error("Error fetching participations:", participationsError)
    return {
      error: "Failed to fetch conversations",
    }
  }

  if (!participations.length) {
    return { conversations: [] }
  }

  const conversationIds = participations.map((p) => p.conversation_id)

  // For each conversation, get the other participants
  const { data: otherParticipants, error: participantsError } = await supabase
    .from("conversation_participants")
    .select(`
      conversation_id,
      profiles:user_id (id, username, full_name, avatar_url)
    `)
    .in("conversation_id", conversationIds)
    .neq("user_id", userId)

  if (participantsError) {
    console.error("Error fetching participants:", participantsError)
    return {
      error: "Failed to fetch conversations",
    }
  }

  // Get the last message for each conversation
  const { data: lastMessages, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false })

  if (messagesError) {
    console.error("Error fetching messages:", messagesError)
    return {
      error: "Failed to fetch conversations",
    }
  }

  // Get unread message count
  const { data: unreadCounts, error: unreadError } = await supabase
    .from("messages")
    .select("conversation_id, count")
    .in("conversation_id", conversationIds)
    .eq("read", false)
    .neq("user_id", userId)
    .group("conversation_id")

  if (unreadError) {
    console.error("Error fetching unread counts:", unreadError)
    return {
      error: "Failed to fetch conversations",
    }
  }

  // Build conversations list
  const conversations = otherParticipants
    .map((participant) => {
      const lastMessage = lastMessages.find((m) => m.conversation_id === participant.conversation_id)
      const unreadCount = unreadCounts.find((c) => c.conversation_id === participant.conversation_id)

      return {
        id: participant.conversation_id,
        otherUser: participant.profiles,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              created_at: lastMessage.created_at,
            }
          : null,
        unreadCount: unreadCount ? Number.parseInt(unreadCount.count as string) : 0,
      }
    })
    .filter((c) => c.lastMessage !== null)

  return { conversations }
}

export async function createConversation(otherUserId: string) {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return {
      error: "Not authenticated",
    }
  }

  const userId = session.user.id

  // Check if conversation already exists
  const { data: existingConversations, error: checkError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId)

  if (checkError) {
    console.error("Error checking for existing conversations:", checkError)
    return {
      error: "Failed to create conversation",
    }
  }

  const conversationIds = existingConversations.map((p) => p.conversation_id)

  if (conversationIds.length > 0) {
    const { data: existingParticipations, error: existingError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .in("conversation_id", conversationIds)
      .eq("user_id", otherUserId)

    if (existingError) {
      console.error("Error checking for existing participations:", existingError)
      return {
        error: "Failed to create conversation",
      }
    }

    if (existingParticipations.length > 0) {
      // Conversation already exists, return its ID
      return {
        id: existingParticipations[0].conversation_id,
      }
    }
  }

  // Create new conversation
  const { data: conversation, error: createError } = await supabase.from("conversations").insert({}).select().single()

  if (createError) {
    console.error("Error creating conversation:", createError)
    return {
      error: "Failed to create conversation",
    }
  }

  // Add participants
  const { error: participantsError } = await supabase.from("conversation_participants").insert([
    { conversation_id: conversation.id, user_id: userId },
    { conversation_id: conversation.id, user_id: otherUserId },
  ])

  if (participantsError) {
    console.error("Error adding participants:", participantsError)
    return {
      error: "Failed to create conversation",
    }
  }

  revalidatePath("/messages")

  return {
    id: conversation.id,
  }
}

export async function getMessages(conversationId: string) {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return {
      error: "Not authenticated",
    }
  }

  // Check if user is a participant in this conversation
  const { data: participation, error: participationError } = await supabase
    .from("conversation_participants")
    .select()
    .eq("conversation_id", conversationId)
    .eq("user_id", session.user.id)
    .single()

  if (participationError || !participation) {
    return {
      error: "Not authorized to access this conversation",
    }
  }

  // Get messages
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (messagesError) {
    console.error("Error fetching messages:", messagesError)
    return {
      error: "Failed to fetch messages",
    }
  }

  // Mark messages as read
  await supabase
    .from("messages")
    .update({ read: true })
    .eq("conversation_id", conversationId)
    .neq("user_id", session.user.id)
    .eq("read", false)

  return {
    messages: messages.map((message) => ({
      ...message,
      sender_is_self: message.user_id === session.user.id,
    })),
  }
}

export async function sendMessage(conversationId: string, content: string) {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return {
      error: "Not authenticated",
    }
  }

  if (!content.trim()) {
    return {
      error: "Message cannot be empty",
    }
  }

  // Check if user is a participant in this conversation
  const { data: participation, error: participationError } = await supabase
    .from("conversation_participants")
    .select()
    .eq("conversation_id", conversationId)
    .eq("user_id", session.user.id)
    .single()

  if (participationError || !participation) {
    return {
      error: "Not authorized to send messages in this conversation",
    }
  }

  // Send message
  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      user_id: session.user.id,
      content: content.trim(),
      read: false,
    })
    .select()
    .single()

  if (messageError) {
    console.error("Error sending message:", messageError)
    return {
      error: "Failed to send message",
    }
  }

  revalidatePath("/messages")

  return { message }
}
