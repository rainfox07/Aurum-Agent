import { AppShell } from "@/components/layout/app-shell";
import { ChatWorkbench } from "@/components/chat/chat-workbench";

export default function ChatPage() {
  return (
    <AppShell title="Knowledge Workbench">
      <ChatWorkbench initialMessages={[]} />
    </AppShell>
  );
}
