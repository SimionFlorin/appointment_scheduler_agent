"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { MessageSquare, Send, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ConversationMessage {
  role: "customer" | "assistant";
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  customerPhone: string;
  customerName: string | null;
  messages: ConversationMessage[];
  lastMessageAt: string;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState<string>("America/New_York");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const [data, tzData] = await Promise.all([
      fetch("/api/conversations").then((r) => r.json()),
      fetch("/api/user/timezone").then((r) => r.json()),
    ]);
    setConversations(data);
    setTimezone(tzData.timezone || "America/New_York");
    return data as Conversation[];
  }, []);

  useEffect(() => {
    loadConversations().then(() => setLoading(false));
  }, [loadConversations]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [selected?.messages]);

  async function refreshConversations() {
    setRefreshing(true);
    try {
      const data = await loadConversations();
      if (selected) {
        const updated = data.find((c: Conversation) => c.id === selected.id);
        if (updated) setSelected(updated);
      }
      toast.success("Conversations refreshed");
    } catch {
      toast.error("Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  }

  async function sendReply() {
    if (!selected || !replyText.trim() || sending) return;

    const text = replyText.trim();
    setSending(true);

    try {
      const res = await fetch("/api/conversations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: selected.customerPhone,
          message: text,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to send message");
        return;
      }

      const newMsg: ConversationMessage = {
        role: "assistant",
        content: text,
        timestamp: new Date().toISOString(),
      };
      const updatedSelected = {
        ...selected,
        messages: [...selected.messages, newMsg],
        lastMessageAt: new Date().toISOString(),
      };
      setSelected(updatedSelected);
      setConversations((prev) =>
        prev.map((c) => (c.id === selected.id ? updatedSelected : c))
      );
      setReplyText("");
      toast.success("Message sent");
    } catch {
      toast.error("Network error");
    } finally {
      setSending(false);
    }
  }

  function formatInBizTz(dateStr: string, fmt: string) {
    return format(toZonedTime(new Date(dateStr), timezone), fmt);
  }

  if (loading) {
    return (
      <p className="text-muted-foreground text-center py-10">Loading...</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Conversations</h1>
          <p className="text-muted-foreground">
            WhatsApp conversations — view messages and reply manually
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshConversations}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        {/* Conversation list */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {conversations.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No conversations yet.</p>
                <p className="text-xs mt-1">
                  They will appear here when customers message your WhatsApp.
                </p>
              </CardContent>
            </Card>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelected(conv)}
                className={`w-full text-left rounded-lg border p-3 transition-colors hover:bg-muted ${
                  selected?.id === conv.id ? "bg-muted border-primary" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">
                      {conv.customerName || conv.customerPhone}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {conv.customerPhone}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {conv.messages.length}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {conv.messages[conv.messages.length - 1]?.content || ""}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatInBizTz(conv.lastMessageAt, "MMM d, h:mm a")}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Chat view */}
        <Card className="flex flex-col min-h-[500px]">
          <CardContent className="flex flex-col flex-1 p-0 overflow-hidden">
            {!selected ? (
              <div className="flex items-center justify-center h-full min-h-[460px] text-muted-foreground p-4">
                Select a conversation to view messages
              </div>
            ) : (
              <>
                <div className="border-b p-4 pb-3">
                  <p className="font-semibold">
                    {selected.customerName || selected.customerPhone}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selected.customerPhone}
                  </p>
                </div>
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-3"
                >
                  {selected.messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        msg.role === "assistant" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          msg.role === "assistant"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.role === "assistant"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatInBizTz(msg.timestamp, "h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t p-3 flex gap-2">
                  <Input
                    placeholder="Type a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                    disabled={sending}
                  />
                  <Button
                    onClick={sendReply}
                    disabled={sending || !replyText.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
