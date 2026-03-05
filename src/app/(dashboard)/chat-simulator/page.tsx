"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { RotateCcw, Send, Trash2 } from "lucide-react";

interface Message {
  role: "customer" | "assistant";
  content: string;
  timestamp: string;
}

export default function ChatSimulatorPage() {
  const [customerPhone, setCustomerPhone] = useState("+0000000000");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deletingTests, setDeletingTests] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Message = {
      role: "customer",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, customerPhone }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to get response");
        return;
      }

      const assistantMsg: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      toast.error("Network error");
    } finally {
      setSending(false);
    }
  }

  async function resetConversation() {
    setResetting(true);
    try {
      await fetch(
        `/api/chat/simulate?customerPhone=${encodeURIComponent(customerPhone)}`,
        { method: "DELETE" }
      );
      setMessages([]);
      toast.success("Conversation reset");
    } catch {
      toast.error("Failed to reset");
    } finally {
      setResetting(false);
    }
  }

  async function deleteTestAppointments() {
    setDeletingTests(true);
    try {
      const res = await fetch("/api/appointments/test", { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          data.deleted > 0
            ? `Deleted ${data.deleted} test appointment${data.deleted > 1 ? "s" : ""} (and their calendar events)`
            : "No test appointments to delete"
        );
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeletingTests(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chat Simulator</h1>
        <p className="text-muted-foreground">
          You are chatting as a <strong>customer</strong> of your business.
          Type messages below to test how the AI scheduling agent responds.
          Appointments booked here are marked as test and will appear in your
          Google Calendar with a "(Test Appointment)" prefix.
        </p>
      </div>

      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1.5">
          <Label htmlFor="sim-phone" className="text-xs">
            Simulated customer phone
          </Label>
          <Input
            id="sim-phone"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-52 font-mono text-sm"
            disabled={messages.length > 0}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetConversation}
          disabled={resetting || messages.length === 0}
        >
          <RotateCcw className="h-4 w-4 mr-1.5" />
          {resetting ? "Resetting..." : "Reset Conversation"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={deleteTestAppointments}
          disabled={deletingTests}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          {deletingTests ? "Deleting..." : "Delete All Test Appointments"}
        </Button>
      </div>

      <Card className="flex flex-col" style={{ height: "calc(100vh - 320px)" }}>
        <CardContent className="flex flex-col flex-1 p-0 overflow-hidden">
          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Send a message to start a simulated conversation
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "customer" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "customer"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.role === "customer"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {format(new Date(msg.timestamp), "h:mm a")}
                  </p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2 text-sm text-muted-foreground">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-3 flex gap-2">
            <Input
              placeholder="Type a message as a customer..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={sending}
              autoFocus
            />
            <Button onClick={sendMessage} disabled={sending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
