"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { BookOpen, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BookMirrorView, ChatMessageView, CitationView, SelectedBookSourceView } from "@/lib/types";
import {
  AURUM_EVENTS,
  consumePendingChatCommand,
  createEmptyConversation,
  hasUsableApiConfig,
  readActiveConversationId,
  readApiConfig,
  readConversations,
  titleFromMessages,
  upsertConversation,
  writeActiveConversationId,
  type StoredConversation
} from "@/lib/client-store";

type ChatResponse = {
  messageId: string;
  markdown: string;
  selectedBooks?: SelectedBookSourceView[];
  citations?: CitationView[];
  lowConfidence?: boolean;
  model: string;
  aiMode: "live" | "mock";
  warning?: string;
};

type BookMirrorStartResponse = BookMirrorView & {
  introMarkdown: string;
};

export function ChatWorkbench({
  initialMessages
}: {
  initialMessages: ChatMessageView[];
}) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessageView[]>(initialMessages);
  const [loading, setLoading] = useState<"send" | "mirror" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [bookMirror, setBookMirror] = useState<BookMirrorView | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const activateConversation = useCallback((conversation: StoredConversation) => {
    writeActiveConversationId(conversation.id);
    setActiveConversationId(conversation.id);
    setMessages(conversation.messages);
    setBookMirror(conversation.bookMirror ?? null);
    setQuestion("");
    setError(null);
  }, []);

  const startNewConversation = useCallback(() => {
    if (messages.length === 0) {
      setQuestion("");
      setError(null);
      return;
    }

    const conversation = createEmptyConversation();
    activateConversation(conversation);
    upsertConversation(conversation);
  }, [activateConversation, messages.length]);

  useEffect(() => {
    const conversations = readConversations();
    const pendingCommand = consumePendingChatCommand();

    if (pendingCommand === "new-chat") {
      const conversation = createEmptyConversation();
      activateConversation(conversation);
      upsertConversation(conversation);
      setHydrated(true);
      return;
    }

    const activeId = readActiveConversationId();
    const activeConversation = conversations.find((conversation) => conversation.id === activeId) ?? conversations[0];

    if (activeConversation) {
      activateConversation(activeConversation);
    } else {
      const conversation = createEmptyConversation();
      activateConversation(conversation);
      upsertConversation(conversation);
    }

    setHydrated(true);
  }, [activateConversation]);

  useEffect(() => {
    function handleNewChat() {
      startNewConversation();
    }

    function handleOpenConversation(event: Event) {
      const conversationId = (event as CustomEvent<{ conversationId?: string }>).detail?.conversationId;
      if (!conversationId) {
        return;
      }

      const conversation = readConversations().find((item) => item.id === conversationId);
      if (conversation) {
        activateConversation(conversation);
      }
    }

    window.addEventListener(AURUM_EVENTS.newChat, handleNewChat);
    window.addEventListener(AURUM_EVENTS.openConversation, handleOpenConversation);
    return () => {
      window.removeEventListener(AURUM_EVENTS.newChat, handleNewChat);
      window.removeEventListener(AURUM_EVENTS.openConversation, handleOpenConversation);
    };
  }, [activateConversation, startNewConversation]);

  useEffect(() => {
    if (!hydrated || !activeConversationId) {
      return;
    }

    const existing = readConversations().find((conversation) => conversation.id === activeConversationId);
    const now = new Date().toISOString();
    upsertConversation({
      id: activeConversationId,
      title: titleFromMessages(messages),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      messages,
      bookMirror
    });
  }, [activeConversationId, bookMirror, hydrated, messages]);

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) {
      return;
    }

    const submittedQuestion = question.trim();
    setError(null);
    setLoading("send");
    setQuestion("");
    const userMessage: ChatMessageView = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content: submittedQuestion,
      bookMirror: bookMirror ?? undefined,
      createdAt: new Date().toISOString()
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);

    try {
      const apiConfig = readApiConfig();
      const llmConfig = hasUsableApiConfig(apiConfig) ? apiConfig : undefined;
      const response = bookMirror
        ? await fetch("/api/author-mode/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId: bookMirror.conversationId ?? `book-mirror-${bookMirror.sourceId}`,
              branchId: bookMirror.branchId ?? `book-mirror-${bookMirror.sourceId}-main`,
              sourceId: bookMirror.sourceId,
              source: bookMirror,
              message: submittedQuestion,
              llmConfig
            })
          })
        : await fetch("/api/preset-book-answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question: submittedQuestion,
              conversationMessages: nextMessages
                .filter((message) => message.role === "user" || message.role === "assistant")
                .map((message) => ({ role: message.role, content: message.content })),
              llmConfig
            })
          });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to generate answer.");
      }
      const answer = (await response.json()) as ChatResponse;
      const assistantMessage: ChatMessageView = {
        id: answer.messageId,
        role: "assistant",
        content: answer.markdown,
        citations: answer.citations,
        selectedBooks: answer.selectedBooks,
        lowConfidence: answer.lowConfidence,
        aiMode: answer.aiMode,
        model: answer.model,
        warning: answer.warning,
        bookMirror: bookMirror ?? undefined,
        createdAt: new Date().toISOString()
      };
      setMessages((current) => [...current, assistantMessage]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send message.");
    } finally {
      setLoading(null);
    }
  }

  async function enterBookMirror(source: SelectedBookSourceView) {
    setError(null);
    setLoading("mirror");

    try {
      const response = await fetch("/api/author-mode/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: source.id,
          source: {
            sourceId: source.id,
            title: source.title,
            author: source.author,
            sourceRef: source.sourceRef,
            quotedText: source.quotedText
          }
        })
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "无法进入书镜。");
      }

      const session = (await response.json()) as BookMirrorStartResponse;
      const nextMirror: BookMirrorView = {
        sourceId: session.sourceId,
        title: session.title,
        author: session.author,
        sourceRef: session.sourceRef,
        quotedText: session.quotedText,
        conversationId: session.conversationId,
        branchId: session.branchId
      };
      setBookMirror(nextMirror);
      setMessages((current) => [
        ...current,
        {
          id: `book-mirror-intro-${Date.now()}`,
          role: "assistant",
          content: session.introMarkdown,
          bookMirror: nextMirror,
          createdAt: new Date().toISOString()
        }
      ]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法进入书镜。");
    } finally {
      setLoading(null);
    }
  }

  function exitBookMirror() {
    setBookMirror(null);
  }

  return (
    <div className="chat-layout single-chat-layout">
      <div className="chat-workbench">
        <div className="reader-column chat-reader">
          <header className="chat-header">
            <div>
              <h1 className="headline">{titleFromMessages(messages)}</h1>
              <p className="muted label" style={{ margin: "8px 0 0" }}>
                具体问题会自动参考 3 本预设书籍，用轻松中文回答。
              </p>
            </div>
          </header>

          {bookMirror ? <BookMirrorActiveBar mirror={bookMirror} onExit={exitBookMirror} /> : null}

          <section style={{ display: "grid", gap: 28 }}>
            {messages.map((message) => (
              <article
                key={message.id}
                className={message.role === "assistant" ? "ai-accent-line" : ""}
                style={{
                  justifySelf: message.role === "user" ? "end" : "start",
                  maxWidth: message.role === "user" ? "82%" : "100%"
                }}
              >
                <div className={message.role === "user" ? "surface-card" : ""} style={{ padding: message.role === "user" ? 18 : 0 }}>
                  {message.role === "assistant" && message.lowConfidence ? (
                    <div className="surface-card" style={{ padding: 12, marginBottom: 14 }}>
                      <span className="muted label">这次选的书可能只和问题部分相关。</span>
                    </div>
                  ) : null}
                  {message.role === "assistant" ? (
                    <AssistantStatus aiMode={message.aiMode} model={message.model} warning={message.warning} />
                  ) : null}
                  {message.bookMirror ? <BookMirrorMessageLabel mirror={message.bookMirror} /> : null}
                  <RenderedMessage content={message.content} showCitationMarkers={Boolean(message.bookMirror)} />
                  {message.bookMirror && message.citations?.length ? <InlineCitations citations={message.citations} /> : null}
                  {message.role === "assistant" && !bookMirror && canEnterBookMirror(message) ? (
                    <BookMirrorEntry
                      selectedBooks={message.selectedBooks ?? []}
                      disabled={loading === "mirror"}
                      onEnter={enterBookMirror}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </section>

          {error ? (
            <div className="surface-card" style={{ borderColor: "var(--error)", padding: 14, color: "var(--error)" }}>
              {error}
            </div>
          ) : null}
        </div>

        <form onSubmit={submitQuestion} className="chat-composer">
          <div className="surface-card chat-input-card">
            <input
              className="underline-input"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="随便说点什么，或问一个具体问题..."
              aria-label="Question"
            />
            <Button variant="primary" disabled={loading === "send"}>
              <Send size={16} aria-hidden="true" />
              {loading === "send" ? "Sending..." : bookMirror ? "问书镜" : "Send"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function canEnterBookMirror(message: ChatMessageView) {
  return message.role === "assistant" && (message.selectedBooks?.length ?? 0) === 3;
}

function BookMirrorEntry({
  selectedBooks,
  disabled,
  onEnter
}: {
  selectedBooks: SelectedBookSourceView[];
  disabled: boolean;
  onEnter: (source: SelectedBookSourceView) => void;
}) {
  return (
    <div className="book-mirror-entry">
      <div>
        <h2>是否进入书镜？</h2>
        <p>书镜让您沉浸在书的世界。AI 会扮演该书作者回答你的问题，必要时引用书中的文本。</p>
      </div>
      <div className="book-mirror-options">
        {selectedBooks.map((book) => (
          <Button key={book.id} type="button" disabled={disabled} onClick={() => onEnter(book)}>
            <BookOpen size={15} aria-hidden="true" />
            {book.author}
          </Button>
        ))}
      </div>
    </div>
  );
}

function BookMirrorActiveBar({ mirror, onExit }: { mirror: BookMirrorView; onExit: () => void }) {
  return (
    <div className="book-mirror-active">
      <div>
        <div className="meta">书镜：AI 模拟作者</div>
        <strong>
          {mirror.author} · 从《{mirror.title}》进入
        </strong>
      </div>
      <Button type="button" onClick={onExit}>
        <X size={15} aria-hidden="true" />
        退出书镜
      </Button>
    </div>
  );
}

function BookMirrorMessageLabel({ mirror }: { mirror: BookMirrorView }) {
  return (
    <div className="book-mirror-label">
      <BookOpen size={14} aria-hidden="true" />
      书镜：AI 模拟作者 · {mirror.author}
    </div>
  );
}

function InlineCitations({ citations }: { citations: CitationView[] }) {
  return (
    <div className="inline-citations">
      <div className="meta">引用</div>
      {citations.map((citation) => (
        <div key={citation.id}>
          <strong>[^{citation.evidenceId}]</strong> 《{citation.title}》 · {citation.sourceRef}
        </div>
      ))}
    </div>
  );
}

function AssistantStatus({
  aiMode,
  model,
  warning
}: {
  aiMode?: "live" | "mock";
  model?: string;
  warning?: string;
}) {
  if (!aiMode && !model && !warning) {
    return null;
  }

  const label = aiMode === "live" ? "模型响应" : "本地兜底";
  const displayWarning = normalizeWarning(warning);

  return (
    <div className={`message-status ${aiMode === "live" ? "live" : "mock"}`}>
      <div className="meta">
        {label}
        {model ? ` · ${model}` : ""}
      </div>
      {displayWarning ? <div className="message-warning">{displayWarning}</div> : null}
    </div>
  );
}

function normalizeWarning(warning?: string) {
  if (!warning) {
    return undefined;
  }

  if (warning === "Live AI failed or returned an uncited answer. Served local cited fallback.") {
    return "模型回答缺少引用标记，已使用本地书镜 fallback。";
  }

  return warning;
}

function RenderedMessage({ content, showCitationMarkers = false }: { content: string; showCitationMarkers?: boolean }) {
  const normalizedContent = showCitationMarkers ? content : content.replace(/\s*\[\^[a-z]+_\d+\]/g, "");
  const paragraphs = normalizedContent.split(/\n{2,}/).filter(Boolean);
  return (
    <div className="answer-text">
      {paragraphs.map((paragraph) => {
        const trimmed = paragraph.trim();
        if (trimmed.startsWith(">")) {
          return (
            <blockquote key={paragraph} className="answer-quote">
              {renderInlineStrong(trimmed.replace(/^>\s?/gm, ""))}
            </blockquote>
          );
        }

        return <p key={paragraph}>{renderInlineStrong(paragraph)}</p>;
      })}
    </div>
  );
}

function renderInlineStrong(text: string) {
  return text.split(/(\*\*[^*]+\*\*|\[\^[a-z]+_\d+\])/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    const citation = part.match(/^\[\^([a-z]+)_(\d+)\]$/);
    if (citation) {
      return (
        <sup key={`${part}-${index}`} className="citation-marker">
          [{citation[2]}]
        </sup>
      );
    }

    return part;
  });
}
