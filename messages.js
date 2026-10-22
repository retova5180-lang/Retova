(() => {
  "use strict";

  const client = window.supabase.createClient(
    "https://bfqsqgfyyewnfxekirfv.supabase.co",
    "sb_publishable_OM-LGm9LZCtmzkGYmpyA8A_jnvgmH1-"
  );
  const $ = selector => document.querySelector(selector);
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);

  let userId = null;
  let activeConversation = null;
  let conversations = [];

  async function resolveUserId() {
    const { data } = await client.auth.getSession();
    userId = data.session?.user?.id || null;
    if (!userId) {
      try {
        userId = JSON.parse(localStorage.getItem("ars_user") || "{}").id || null;
      } catch {
        userId = null;
      }
    }
    return userId;
  }

  function otherUser(conversation) {
    return conversation.user1_id === userId ? conversation.user2 : conversation.user1;
  }

  async function loadConversationMessages(conversationId) {
    activeConversation = conversationId;
    const conversation = conversations.find(item => item.id === conversationId);
    const person = conversation ? otherUser(conversation) : null;
    $("#chatTitle").textContent = person?.display_name || person?.username || "Conversation";
    $("#chatLog").innerHTML = "<p class='empty-state'>Loading messages…</p>";

    const { data, error } = await client
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      $("#chatLog").innerHTML = "<p class='empty-state'>Messages could not be loaded. Check message access policies.</p>";
      return;
    }

    $("#chatLog").innerHTML = (data || []).map(message => `
      <article class="message-bubble ${message.sender_id === userId ? "mine" : ""}">
        <p>${escapeHTML(message.content)}</p>
        <time>${new Date(message.created_at).toLocaleString()}</time>
      </article>
    `).join("") || "<p class='empty-state'>No messages yet. Say hello!</p>";
    $("#chatLog").scrollTop = $("#chatLog").scrollHeight;

    document.querySelectorAll("[data-conversation-id]").forEach(button => {
      button.classList.toggle("active", button.dataset.conversationId === conversationId);
    });
  }

  async function loadConversations() {
    if (!await resolveUserId()) {
      $("#conversationList").innerHTML = "<p class='empty-state'>Sign in to see your messages.</p>";
      return;
    }

    $("#conversationList").innerHTML = "<p class='empty-state'>Loading conversations…</p>";
    const { data, error } = await client
      .from("conversations")
      .select("id, user1_id, user2_id, last_message, created_at, user1:users!conversations_user1_id_fkey(id, username, display_name), user2:users!conversations_user2_id_fkey(id, username, display_name)")
      .or("user1_id.eq." + userId + ",user2_id.eq." + userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      $("#conversationList").innerHTML = "<p class='empty-state'>Conversations could not be loaded. Check message access policies.</p>";
      return;
    }

    conversations = data || [];
    $("#conversationList").innerHTML = conversations.map(conversation => {
      const person = otherUser(conversation) || {};
      return `
        <button class="conversation-item" type="button" data-conversation-id="${escapeHTML(conversation.id)}">
          <strong>${escapeHTML(person.display_name || person.username || "ARS member")}</strong>
          <span>${escapeHTML(conversation.last_message || "Start a conversation")}</span>
        </button>
      `;
    }).join("") || "<p class='empty-state'>No conversations yet.</p>";

    if (conversations.length && !activeConversation) {
      await loadConversationMessages(conversations[0].id);
    } else if (activeConversation && conversations.some(item => item.id === activeConversation)) {
      await loadConversationMessages(activeConversation);
    }
  }

  $("#conversationList").addEventListener("click", event => {
    const button = event.target.closest("[data-conversation-id]");
    if (button) loadConversationMessages(button.dataset.conversationId);
  });

  $("#refreshMessages").addEventListener("click", () => {
    loadConversations().catch(() => {
      $("#messageStatus").textContent = "Could not refresh conversations.";
    });
  });

  $("#sendMessageForm").addEventListener("submit", async event => {
    event.preventDefault();
    const content = $("#messageText").value.trim();
    if (!content || !userId || !activeConversation) {
      $("#messageStatus").textContent = "Choose a conversation before sending a message.";
      return;
    }

    const sendButton = event.submitter;
    if (sendButton) sendButton.disabled = true;
    $("#messageStatus").textContent = "Sending…";
    const { error } = await client.from("messages").insert({
      conversation_id: activeConversation,
      sender_id: userId,
      content
    });

    if (error) {
      $("#messageStatus").textContent = "Message was not sent. Check message access policies.";
      if (sendButton) sendButton.disabled = false;
      return;
    }

    $("#messageText").value = "";
    await client.from("conversations").update({ last_message: content }).eq("id", activeConversation);
    $("#messageStatus").textContent = "";
    await loadConversationMessages(activeConversation);
    if (sendButton) sendButton.disabled = false;
  });

  loadConversations().catch(() => {
    $("#conversationList").innerHTML = "<p class='empty-state'>Messages are unavailable right now.</p>";
  });
})();