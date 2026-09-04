"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MessageSquare, Send, ShieldCheck, UserCircle2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/app-data";

function ChatContent() {
  const router = useRouter();
  const params = useSearchParams();
  const targetUserId = params.get("user");

  const { currentUser, chatMessages, users, sendChatMessage } = useApp();
  const [activeUserId, setActiveUserId] = useState<string | null>(targetUserId);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      router.push("/login");
    }
  }, [currentUser, router]);

  // Handle URL change to select target user
  useEffect(() => {
    if (targetUserId) {
      setActiveUserId(targetUserId);
    }
  }, [targetUserId]);

  // Scroll to bottom on active chat change or new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, activeUserId]);

  if (!currentUser) return null;

  // Filter messages belonging to the current user
  const myMessages = chatMessages.filter(
    (msg) => msg.senderId === currentUser.id || msg.receiverId === currentUser.id,
  );

  // Extract all unique chat partner IDs
  const chatPartnerIds = Array.from(
    new Set(
      myMessages.map((msg) =>
        msg.senderId === currentUser.id ? msg.receiverId : msg.senderId,
      ),
    ),
  );

  // If a user was passed in parameters and isn't in history yet, append them to history list
  if (targetUserId && !chatPartnerIds.includes(targetUserId)) {
    chatPartnerIds.push(targetUserId);
  }

  // Map partner IDs to actual user objects
  const threads = chatPartnerIds
    .map((partnerId) => {
      const partner = users.find((u) => u.id === partnerId);
      const conversation = myMessages.filter(
        (msg) =>
          (msg.senderId === currentUser.id && msg.receiverId === partnerId) ||
          (msg.senderId === partnerId && msg.receiverId === currentUser.id),
      );
      const lastMessage = conversation.length > 0 ? conversation[conversation.length - 1] : null;

      return {
        partner,
        lastMessage,
      };
    })
    .filter((t) => t.partner)
    .sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });

  const activePartner = users.find((u) => u.id === activeUserId);
  const activeConversation = myMessages.filter(
    (msg) =>
      (msg.senderId === currentUser.id && msg.receiverId === activeUserId) ||
      (msg.senderId === activeUserId && msg.receiverId === currentUser.id),
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeUserId) return;

    sendChatMessage(activeUserId, messageText.trim());
    setMessageText("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 container py-6 flex flex-col md:flex-row gap-6 max-h-[calc(100vh-4.5rem)] overflow-hidden">
        {/* Left column: Conversations sidebar */}
        <div className="w-full md:w-80 border border-border bg-card rounded-2xl flex flex-col overflow-hidden shadow-card">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Conversations
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {threads.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No active conversations yet.
              </div>
            ) : (
              threads.map(({ partner, lastMessage }) => {
                const isSelected = activeUserId === partner?.id;
                return (
                  <button
                    key={partner?.id}
                    onClick={() => setActiveUserId(partner?.id || null)}
                    className={`w-full text-left p-4 flex items-center gap-2.5 transition-colors ${
                      isSelected
                        ? "bg-accent/60 text-foreground"
                        : "hover:bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                      {partner?.storeName ? partner.storeName.slice(0, 2).toUpperCase() : partner?.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-foreground truncate flex items-center gap-1">
                        {partner?.storeName || partner?.name}
                        {partner?.verified && (
                          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {lastMessage ? lastMessage.message : "Start chat..."}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Chat active interface */}
        <div className="flex-1 border border-border bg-card rounded-2xl flex flex-col overflow-hidden shadow-card">
          {activePartner ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {activePartner.storeName ? activePartner.storeName.slice(0, 2).toUpperCase() : activePartner.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      {activePartner.storeName || activePartner.name}
                      {activePartner.verified && (
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                      {activePartner.role} • {activePartner.location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/5">
                {activeConversation.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    Send a message to start negotiating directly.
                  </div>
                ) : (
                  activeConversation.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-subtle ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-card border border-border text-foreground rounded-tl-none"
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                          <span
                            className={`block text-[10px] mt-1 text-right ${
                              isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                            }`}
                          >
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon" className="shrink-0 bg-primary hover:bg-primary/90">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center text-primary mb-4 animate-bounce">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">In-Site Chat Portal</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Select a contact from the sidebar or click "Message Seller" on a listing card to start negotiating.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">Loading chat…</div>}>
      <ChatContent />
    </Suspense>
  );
}
