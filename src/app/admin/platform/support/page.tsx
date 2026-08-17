import { MessageCircle } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/guard";
import { listContactMessages } from "@/lib/admin/queries";
import { SupportInbox } from "@/components/admin/support-inbox";

export default async function PlatformSupportPage() {
  await requirePlatformAdmin();
  const messages = await listContactMessages();
  const newCount = messages.filter((m) => m.status === "NEW").length;

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <MessageCircle size={20} className="text-[#7CA6E8]" />
        <div>
          <h1 className="text-base font-semibold text-[#E7ECF5] leading-tight">Support messages</h1>
          <p className="text-xs text-[#7488AA]">{newCount} unread of {messages.length} total</p>
        </div>
      </div>

      <SupportInbox messages={messages} />
    </div>
  );
}
