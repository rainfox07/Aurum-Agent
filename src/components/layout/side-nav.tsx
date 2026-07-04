"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, MessageSquarePlus, Settings, Trash2 } from "lucide-react";
import {
  AURUM_EVENTS,
  deleteConversation,
  emitAurumEvent,
  readActiveConversationId,
  readConversations,
  setPendingChatCommand,
  writeActiveConversationId,
  type StoredConversation
} from "@/lib/client-store";

export function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [history, setHistory] = useState<StoredConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  useEffect(() => {
    function refreshHistory() {
      setHistory(readConversations().filter((conversation) => conversation.messages.length > 0));
      setActiveConversationId(readActiveConversationId());
    }

    refreshHistory();
    window.addEventListener(AURUM_EVENTS.historyUpdated, refreshHistory);
    window.addEventListener(AURUM_EVENTS.openConversation, refreshHistory);
    window.addEventListener(AURUM_EVENTS.newChat, refreshHistory);
    window.addEventListener("storage", refreshHistory);
    return () => {
      window.removeEventListener(AURUM_EVENTS.historyUpdated, refreshHistory);
      window.removeEventListener(AURUM_EVENTS.openConversation, refreshHistory);
      window.removeEventListener(AURUM_EVENTS.newChat, refreshHistory);
      window.removeEventListener("storage", refreshHistory);
    };
  }, []);

  function startNewChat() {
    if (pathname.startsWith("/chat")) {
      emitAurumEvent(AURUM_EVENTS.newChat);
      return;
    }

    setPendingChatCommand("new-chat");
    router.push("/chat");
  }

  function openConversation(conversationId: string) {
    writeActiveConversationId(conversationId);
    setActiveConversationId(conversationId);

    if (pathname.startsWith("/chat")) {
      emitAurumEvent(AURUM_EVENTS.openConversation, { conversationId });
      return;
    }

    router.push("/chat");
  }

  function removeConversation(conversationId: string) {
    deleteConversation(conversationId);
    setHistory(readConversations().filter((conversation) => conversation.messages.length > 0));
  }

  return (
    <aside className="side-nav" aria-label="Primary navigation">
      <div>
        <div className="brand-title" style={{ fontSize: 24, lineHeight: "32px", fontWeight: 700 }}>
          Aurum
        </div>
        <div className="meta" style={{ marginTop: 4 }}>
          Source-centric agent
        </div>
      </div>

      <nav className="side-nav-main">
        <button type="button" className={`nav-link nav-action ${pathname.startsWith("/chat") ? "active" : ""}`} onClick={startNewChat}>
          <MessageSquarePlus size={19} aria-hidden="true" />
          <span>New Chat</span>
        </button>
        <Link href="/settings/api" className={`nav-link ${pathname.startsWith("/settings") ? "active" : ""}`}>
          <Settings size={19} aria-hidden="true" />
          <span>Settings</span>
        </Link>
        <Link href="/sign-in" className={`nav-link ${pathname.startsWith("/sign-in") ? "active" : ""}`}>
          <LogIn size={19} aria-hidden="true" />
          <span>Sign in</span>
        </Link>
      </nav>

      <section className="history-list" aria-label="Conversation history">
        <h2 className="meta" style={{ margin: "0 0 10px", textTransform: "uppercase" }}>
          History
        </h2>
        <div style={{ display: "grid", gap: 4 }}>
          {history.length === 0 ? (
            <p className="meta" style={{ margin: 0 }}>
              No saved chats yet.
            </p>
          ) : (
            history.slice(0, 12).map((conversation) => (
              <div key={conversation.id} className={`history-row ${conversation.id === activeConversationId ? "active" : ""}`}>
                <button type="button" className="history-item" onClick={() => openConversation(conversation.id)}>
                  <span>{conversation.title}</span>
                  <time>{new Date(conversation.updatedAt).toLocaleDateString()}</time>
                </button>
                <button
                  type="button"
                  className="history-delete"
                  aria-label={`Delete ${conversation.title}`}
                  onClick={() => removeConversation(conversation.id)}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </aside>
  );
}
