"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { MessageSquare } from "lucide-react";

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

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data) => {
        setConversations(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <p className="text-muted-foreground text-center py-10">Loading...</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Conversations</h1>
        <p className="text-muted-foreground">
          WhatsApp conversations handled by the AI agent
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        {/* Conversation list */}
        <div className="space-y-2">
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
                  {format(new Date(conv.lastMessageAt), "MMM d, h:mm a")}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Chat view */}
        <Card className="min-h-[500px]">
          <CardContent className="p-4">
            {!selected ? (
              <div className="flex items-center justify-center h-full min-h-[460px] text-muted-foreground">
                Select a conversation to view messages
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border-b pb-3 mb-3">
                  <p className="font-semibold">
                    {selected.customerName || selected.customerPhone}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selected.customerPhone}
                  </p>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
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
                          {format(new Date(msg.timestamp), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
