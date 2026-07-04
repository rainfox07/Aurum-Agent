import type { BookMirrorView, ChatMessageView, CitationView } from "@/lib/types";

export type StoredApiConfig = {
  baseUrl: string;
  model: string;
  apiKey: string;
  updatedAt?: string;
};

export type StoredConversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessageView[];
  bookMirror?: BookMirrorView | null;
};

export type StoredLocalUser = {
  email: string;
  signedInAt: string;
};

export const AURUM_EVENTS = {
  historyUpdated: "aurum:history-updated",
  newChat: "aurum:new-chat",
  openConversation: "aurum:open-conversation"
} as const;

const API_CONFIG_KEY = "aurum.apiConfig.v1";
const CONVERSATIONS_KEY = "aurum.conversations.v1";
const ACTIVE_CONVERSATION_KEY = "aurum.activeConversationId.v1";
const PENDING_CHAT_COMMAND_KEY = "aurum.pendingChatCommand.v1";
const LOCAL_USER_KEY = "aurum.localUser.v1";

export const defaultApiConfig: StoredApiConfig = {
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-chat",
  apiKey: ""
};

export function readApiConfig(): StoredApiConfig {
  const parsed = readJson<Partial<StoredApiConfig>>(API_CONFIG_KEY);
  return normalizeApiConfig(parsed);
}

export function saveApiConfig(config: StoredApiConfig) {
  writeJson(API_CONFIG_KEY, {
    ...normalizeApiConfig(config),
    updatedAt: new Date().toISOString()
  });
}

export function hasUsableApiConfig(config = readApiConfig()) {
  return Boolean(config.apiKey.trim() && config.baseUrl.trim() && config.model.trim());
}

export function saveLocalUserSession(email: string) {
  writeJson(LOCAL_USER_KEY, {
    email: email.trim(),
    signedInAt: new Date().toISOString()
  } satisfies StoredLocalUser);
}

export function readLocalUserSession(): StoredLocalUser | null {
  const parsed = readJson<StoredLocalUser>(LOCAL_USER_KEY);
  if (!parsed?.email) {
    return null;
  }
  return parsed;
}

export function readConversations(): StoredConversation[] {
  const parsed = readJson<StoredConversation[]>(CONVERSATIONS_KEY);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter((conversation) => conversation && typeof conversation.id === "string")
    .map((conversation) => ({
      ...conversation,
      messages: Array.isArray(conversation.messages) ? conversation.messages : []
    }))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function writeConversations(conversations: StoredConversation[]) {
  writeJson(CONVERSATIONS_KEY, conversations.slice(0, 50));
  emitAurumEvent(AURUM_EVENTS.historyUpdated);
}

export function upsertConversation(conversation: StoredConversation) {
  const conversations = readConversations();
  const next = [conversation, ...conversations.filter((item) => item.id !== conversation.id)];
  writeConversations(next);
}

export function deleteConversation(conversationId: string) {
  const conversations = readConversations().filter((conversation) => conversation.id !== conversationId);
  writeConversations(conversations);
}

export function readActiveConversationId() {
  if (!canUseStorage()) {
    return null;
  }
  return window.localStorage.getItem(ACTIVE_CONVERSATION_KEY);
}

export function writeActiveConversationId(conversationId: string) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(ACTIVE_CONVERSATION_KEY, conversationId);
}

export function setPendingChatCommand(command: "new-chat") {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(PENDING_CHAT_COMMAND_KEY, command);
}

export function consumePendingChatCommand() {
  if (!canUseStorage()) {
    return null;
  }
  const command = window.localStorage.getItem(PENDING_CHAT_COMMAND_KEY);
  window.localStorage.removeItem(PENDING_CHAT_COMMAND_KEY);
  return command;
}

export function createEmptyConversation(): StoredConversation {
  const now = new Date().toISOString();
  return {
    id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "新对话",
    createdAt: now,
    updatedAt: now,
    messages: [],
    bookMirror: null
  };
}

export function titleFromMessages(messages: ChatMessageView[]) {
  const firstUserMessage = messages.find((message) => message.role === "user");
  if (!firstUserMessage?.content.trim()) {
    return "新对话";
  }

  const singleLine = firstUserMessage.content.replace(/\s+/g, " ").trim();
  return singleLine.length > 28 ? `${singleLine.slice(0, 28)}...` : singleLine;
}

export function citationsFromMessages(messages: ChatMessageView[]): CitationView[] {
  return messages.flatMap((message) => message.citations ?? []);
}

export function emitAurumEvent(type: string, detail?: unknown) {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(type, { detail }));
}

function normalizeApiConfig(config?: Partial<StoredApiConfig> | null): StoredApiConfig {
  const savedModel = (config?.model ?? defaultApiConfig.model).trim();
  return {
    baseUrl: (config?.baseUrl ?? defaultApiConfig.baseUrl).trim().replace(/\/$/, ""),
    model: savedModel === "deepseek-v4-flash" ? defaultApiConfig.model : savedModel,
    apiKey: config?.apiKey ?? "",
    updatedAt: config?.updatedAt
  };
}

function readJson<T>(key: string): T | null {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}
