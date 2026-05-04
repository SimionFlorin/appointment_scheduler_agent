"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { toZonedTime, fromZonedTime, format as formatTz } from "date-fns-tz";
import { format } from "date-fns";
import {
  Bot,
  CalendarClock,
  CircleSlash,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  UserCheck,
} from "lucide-react";

interface ConversationMessage {
  role: "customer" | "assistant";
  content: string;
  timestamp: string;
  manual?: boolean;
}

interface Conversation {
  id: string;
  customerPhone: string;
  customerName: string | null;
  messages: ConversationMessage[];
  lastMessageAt: string;
}

type ScheduledStatus = "PENDING" | "SENT" | "FAILED" | "CANCELLED";

interface ScheduledMessage {
  id: string;
  customerPhone: string;
  body: string;
  scheduledFor: string;
  status: ScheduledStatus;
  sentAt: string | null;
  error: string | null;
  attempts: number;
  createdAt: string;
}

/**
 * A "virtual" conversation row used when the user starts a brand-new thread
 * by entering a phone number. It only exists in client state until the first
 * message is sent, at which point the backend creates the row.
 */
function makeDraftConversation(phone: string): Conversation {
  return {
    id: `draft:${phone}`,
    customerPhone: phone,
    customerName: null,
    messages: [],
    lastMessageAt: new Date(0).toISOString(),
  };
}

export default function ConversationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneFromQuery = searchParams.get("phone") || "";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledMessage[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(
    phoneFromQuery || null
  );
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState<string>("America/New_York");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState<boolean>(true);

  // Composer state
  const [composeText, setComposeText] = useState("");
  const [sendingNow, setSendingNow] = useState(false);

  // Schedule dialog state
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleTime, setScheduleTime] = useState(""); // datetime-local
  const [scheduling, setScheduling] = useState(false);

  // New conversation dialog
  const [newConvoOpen, setNewConvoOpen] = useState(false);
  const [newConvoPhone, setNewConvoPhone] = useState("");

  const messagesScrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const data = await fetch("/api/conversations").then((r) => r.json());
    setConversations(Array.isArray(data) ? data : []);
  }, []);

  const loadScheduled = useCallback(async () => {
    const data = await fetch("/api/scheduled-messages").then((r) => r.json());
    setScheduled(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/conversations").then((r) => r.json()),
      fetch("/api/user/timezone").then((r) => r.json()),
      fetch("/api/settings/auto-reply").then((r) => r.json()),
      fetch("/api/scheduled-messages").then((r) => r.json()),
    ])
      .then(([convData, tzData, autoReplyData, schedData]) => {
        setConversations(Array.isArray(convData) ? convData : []);
        setTimezone(tzData.timezone || "America/New_York");
        setAutoReplyEnabled(autoReplyData.enabled ?? true);
        setScheduled(Array.isArray(schedData) ? schedData : []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Build a list that includes a draft row when the user picked a phone via
  // ?phone= or "+ New" but no Conversation exists yet.
  const visibleConversations = useMemo<Conversation[]>(() => {
    if (
      selectedPhone &&
      !conversations.some((c) => c.customerPhone === selectedPhone)
    ) {
      return [makeDraftConversation(selectedPhone), ...conversations];
    }
    return conversations;
  }, [conversations, selectedPhone]);

  const selected = useMemo<Conversation | null>(() => {
    if (!selectedPhone) return null;
    return (
      visibleConversations.find((c) => c.customerPhone === selectedPhone) ||
      null
    );
  }, [visibleConversations, selectedPhone]);

  const scheduledForSelected = useMemo<ScheduledMessage[]>(() => {
    if (!selected) return [];
    return scheduled.filter(
      (s) =>
        s.customerPhone === selected.customerPhone &&
        (s.status === "PENDING" || s.status === "FAILED")
    );
  }, [scheduled, selected]);

  // Scroll-to-bottom when a new conversation/message is selected
  useEffect(() => {
    messagesScrollRef.current?.scrollTo({
      top: messagesScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [selected?.messages.length, selected?.customerPhone]);

  function formatInBizTz(dateStr: string, fmt: string) {
    return format(toZonedTime(new Date(dateStr), timezone), fmt);
  }

  function selectConversation(phone: string) {
    setSelectedPhone(phone);
    // Keep the URL in sync so deep-links work but don't trigger nav reload.
    const params = new URLSearchParams(searchParams.toString());
    params.set("phone", phone);
    router.replace(`/conversations?${params.toString()}`, { scroll: false });
  }

  async function handleSendNow() {
    if (!selected || !composeText.trim() || sendingNow) return;
    const body = composeText.trim();
    setSendingNow(true);

    // Optimistic append
    const optimistic: ConversationMessage = {
      role: "assistant",
      content: body,
      timestamp: new Date().toISOString(),
      manual: true,
    };

    try {
      const res = await fetch(
        `/api/conversations/${encodeURIComponent(
          selected.customerPhone
        )}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to send message");
        return;
      }
      setComposeText("");
      // Optimistically update local state, then refetch to catch any drift.
      setConversations((prev) => {
        const exists = prev.some(
          (c) => c.customerPhone === selected.customerPhone
        );
        if (!exists) {
          // Will be refetched below; insert a stub so UI stays consistent.
          return [
            {
              ...selected,
              id: `optimistic:${selected.customerPhone}`,
              messages: [...selected.messages, optimistic],
              lastMessageAt: optimistic.timestamp,
            },
            ...prev,
          ];
        }
        return prev.map((c) =>
          c.customerPhone === selected.customerPhone
            ? {
                ...c,
                messages: [...c.messages, optimistic],
                lastMessageAt: optimistic.timestamp,
              }
            : c
        );
      });
      toast.success("Message sent");
      // Refetch to get authoritative state (id + persisted messages).
      loadConversations();
    } catch {
      toast.error("Network error");
    } finally {
      setSendingNow(false);
    }
  }

  async function handleSchedule() {
    if (!selected || !composeText.trim() || !scheduleTime || scheduling) return;

    let scheduledForIso: string;
    try {
      // datetime-local is naive; interpret in the business timezone.
      scheduledForIso = fromZonedTime(scheduleTime, timezone).toISOString();
    } catch {
      toast.error("Invalid date / time");
      return;
    }

    setScheduling(true);
    try {
      const res = await fetch("/api/scheduled-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: selected.customerPhone,
          body: composeText.trim(),
          scheduledFor: scheduledForIso,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to schedule message");
        return;
      }
      toast.success(
        `Scheduled for ${formatTz(toZonedTime(new Date(scheduledForIso), timezone), "MMM d, h:mm a")}`
      );
      setComposeText("");
      setScheduleTime("");
      setScheduleOpen(false);
      loadScheduled();
    } catch {
      toast.error("Network error");
    } finally {
      setScheduling(false);
    }
  }

  async function cancelScheduled(id: string) {
    const res = await fetch(`/api/scheduled-messages/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Scheduled message cancelled");
      loadScheduled();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to cancel");
    }
  }

  async function sendScheduledNow(id: string) {
    const res = await fetch(`/api/scheduled-messages/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send-now" }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast.success("Message sent");
      loadScheduled();
      loadConversations();
    } else {
      toast.error(data.error || "Failed to send");
      loadScheduled();
    }
  }

  function handleStartNewConversation() {
    const phone = newConvoPhone.trim();
    if (!phone) {
      toast.error("Phone number is required");
      return;
    }
    selectConversation(phone);
    setNewConvoOpen(false);
    setNewConvoPhone("");
  }

  // Default the schedule input to "now + 15 minutes" when opened, in business TZ.
  function openScheduleDialog() {
    if (!composeText.trim()) {
      toast.error("Type a message first");
      return;
    }
    const inFifteen = new Date(Date.now() + 15 * 60_000);
    const local = toZonedTime(inFifteen, timezone);
    // datetime-local format: YYYY-MM-DDTHH:mm
    const yyyy = local.getFullYear();
    const mm = String(local.getMonth() + 1).padStart(2, "0");
    const dd = String(local.getDate()).padStart(2, "0");
    const hh = String(local.getHours()).padStart(2, "0");
    const mi = String(local.getMinutes()).padStart(2, "0");
    setScheduleTime(`${yyyy}-${mm}-${dd}T${hh}:${mi}`);
    setScheduleOpen(true);
  }

  if (loading) {
    return (
      <p className="text-muted-foreground text-center py-10">Loading...</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Conversations</h1>
            {autoReplyEnabled ? (
              <Badge className="bg-green-600 hover:bg-green-600 gap-1">
                <Bot className="h-3 w-3" />
                AI auto-reply: On
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <UserCheck className="h-3 w-3" />
                Manual mode — AI auto-reply off
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {autoReplyEnabled
              ? "WhatsApp conversations handled by the AI agent. You can also reply manually or schedule a message below."
              : "Incoming messages are recorded but not answered automatically. Reply manually or schedule a message below."}
          </p>
        </div>

        <Dialog open={newConvoOpen} onOpenChange={setNewConvoOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New conversation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a new conversation</DialogTitle>
              <DialogDescription>
                Enter the customer&apos;s WhatsApp number in international
                format (e.g. <code>+14155552671</code>). The conversation is
                created the moment you send the first message.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label>Customer WhatsApp number</Label>
              <Input
                placeholder="+14155552671"
                value={newConvoPhone}
                onChange={(e) => setNewConvoPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleStartNewConversation();
                  }
                }}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setNewConvoOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleStartNewConversation}>Start</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        {/* Conversation list */}
        <div className="space-y-2">
          {visibleConversations.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No conversations yet.</p>
                <p className="text-xs mt-1">
                  They will appear here when customers message your WhatsApp,
                  or click <strong>New conversation</strong> to start one.
                </p>
              </CardContent>
            </Card>
          ) : (
            visibleConversations.map((conv) => {
              const isDraft = conv.id.startsWith("draft:");
              const last = conv.messages[conv.messages.length - 1];
              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.customerPhone)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors hover:bg-muted ${
                    selected?.customerPhone === conv.customerPhone
                      ? "bg-muted border-primary"
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {conv.customerName || conv.customerPhone}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.customerPhone}
                      </p>
                    </div>
                    {isDraft ? (
                      <Badge variant="outline" className="text-xs">
                        New
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {conv.messages.length}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {last?.content || (isDraft ? "No messages yet" : "")}
                  </p>
                  {!isDraft && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatInBizTz(conv.lastMessageAt, "MMM d, h:mm a")}
                    </p>
                  )}
                </button>
              );
            })
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
                <div className="border-b pb-3 mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {selected.customerName || selected.customerPhone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selected.customerPhone}
                    </p>
                  </div>
                  {!autoReplyEnabled && (
                    <Badge
                      variant="secondary"
                      className="gap-1 hidden sm:inline-flex"
                    >
                      <UserCheck className="h-3 w-3" />
                      You reply manually
                    </Badge>
                  )}
                </div>

                {/* Messages */}
                <div
                  ref={messagesScrollRef}
                  className="space-y-3 max-h-[360px] min-h-[200px] overflow-y-auto"
                >
                  {selected.messages.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-10">
                      No messages yet. Type one below to start the conversation.
                    </p>
                  )}
                  {selected.messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        msg.role === "assistant"
                          ? "justify-end"
                          : "justify-start"
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
                        <div
                          className={`flex items-center gap-1 mt-1 text-xs ${
                            msg.role === "assistant"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {msg.role === "assistant" && (
                            <span
                              className="inline-flex items-center gap-0.5"
                              title={
                                msg.manual
                                  ? "Sent manually by you"
                                  : "Sent automatically by the AI"
                              }
                            >
                              {msg.manual ? (
                                <UserCheck className="h-3 w-3" />
                              ) : (
                                <Bot className="h-3 w-3" />
                              )}
                              <span className="sr-only">
                                {msg.manual ? "Manual" : "AI"}
                              </span>
                            </span>
                          )}
                          <span>{formatInBizTz(msg.timestamp, "h:mm a")}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Composer */}
                <div className="border-t pt-3 space-y-2">
                  <Label htmlFor="composer" className="text-xs">
                    Send a message as the business
                  </Label>
                  <Textarea
                    id="composer"
                    placeholder="Type your reply…"
                    value={composeText}
                    onChange={(e) => setComposeText(e.target.value)}
                    className="min-h-[72px]"
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        (e.metaKey || e.ctrlKey) &&
                        !sendingNow
                      ) {
                        e.preventDefault();
                        handleSendNow();
                      }
                    }}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={handleSendNow}
                      disabled={sendingNow || !composeText.trim()}
                      className="gap-1.5"
                    >
                      <Send className="h-4 w-4" />
                      {sendingNow ? "Sending…" : "Send now"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={openScheduleDialog}
                      disabled={!composeText.trim()}
                      className="gap-1.5"
                    >
                      <CalendarClock className="h-4 w-4" />
                      Schedule…
                    </Button>
                    <span className="text-xs text-muted-foreground self-center ml-auto">
                      Cmd/Ctrl + Enter to send
                    </span>
                  </div>
                </div>

                {/* Scheduled list */}
                {scheduledForSelected.length > 0 && (
                  <div className="border-t pt-3 space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Scheduled for this conversation
                    </p>
                    {scheduledForSelected.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-lg border p-3 text-sm space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {formatInBizTz(
                                s.scheduledFor,
                                "MMM d, yyyy h:mm a"
                              )}
                            </span>
                            {s.status === "FAILED" && (
                              <Badge variant="destructive" className="text-xs">
                                Failed
                              </Badge>
                            )}
                            {s.status === "PENDING" && (
                              <Badge variant="outline" className="text-xs">
                                Pending
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2"
                              onClick={() => sendScheduledNow(s.id)}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Send now
                            </Button>
                            {s.status === "PENDING" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-destructive hover:text-destructive"
                                onClick={() => cancelScheduled(s.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="whitespace-pre-wrap text-muted-foreground">
                          {s.body}
                        </p>
                        {s.error && (
                          <p className="text-xs text-destructive flex items-start gap-1">
                            <CircleSlash className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>
                              Last error (attempts: {s.attempts}): {s.error}
                            </span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule message</DialogTitle>
            <DialogDescription>
              Pick when this message should be delivered. Times are in the
              business timezone (<strong>{timezone}</strong>).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Send at</Label>
              <Input
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 30 seconds in the future.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                {composeText.trim() || (
                  <span className="text-muted-foreground italic">
                    No message body
                  </span>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSchedule}
              disabled={!scheduleTime || !composeText.trim() || scheduling}
            >
              {scheduling ? "Scheduling…" : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
