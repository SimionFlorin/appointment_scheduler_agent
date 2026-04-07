"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { TimezoneSelect } from "@/components/timezone-select";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

interface BusinessProfile {
  businessName: string;
  phone: string;
  address: string;
  timezone: string;
  [key: string]: string | null;
}

interface WhatsAppStatus {
  provider: string | null;
  isActive: boolean;
  phoneNumberId: string | null;
  twilioPhoneNumber: string | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [waStatus, setWaStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Test message
  const [testPhone, setTestPhone] = useState("");
  const [testSending, setTestSending] = useState(false);

  // WhatsApp form
  const [waProvider, setWaProvider] = useState<"META" | "TWILIO">("META");
  const [wabaId, setWabaId] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioPhone, setTwilioPhone] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // AI Provider
  const [aiProvider, setAiProvider] = useState<"GEMINI" | "OPENAI">("GEMINI");
  const [aiProviderSaving, setAiProviderSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/profile").then((r) => r.json()),
      fetch("/api/whatsapp/connect").then((r) => r.json()),
      fetch("/api/settings/ai-provider").then((r) => r.json()),
    ]).then(([profileData, waData, aiData]) => {
      setProfile(profileData.profile || null);
      setWaStatus(waData.config || null);
      setAiProvider(aiData.provider || "GEMINI");
      setLoading(false);
    });
  }, []);

  async function saveProfile() {
    if (!profile) return;
    const res = await fetch("/api/settings/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.profile) setProfile(data.profile);
      toast.success("Profile updated");
    } else {
      toast.error("Failed to update profile");
    }
  }

  async function saveWhatsApp() {
    const body =
      waProvider === "META"
        ? { provider: "META", wabaId, phoneNumberId, accessToken: metaAccessToken }
        : {
            provider: "TWILIO",
            accountSid: twilioSid,
            authToken: twilioToken,
            phoneNumber: twilioPhone,
          };

    const res = await fetch("/api/whatsapp/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success("WhatsApp connected");
      const waData = await fetch("/api/whatsapp/connect").then((r) => r.json());
      setWaStatus(waData.config || null);
    } else {
      toast.error("Failed to connect WhatsApp");
    }
  }

  function updateHours(day: string, field: "Start" | "End", value: string) {
    if (!profile) return;
    setProfile({ ...profile, [`${day}${field}`]: value || null });
  }

  async function saveAiProvider(provider: "GEMINI" | "OPENAI") {
    setAiProvider(provider);
    setAiProviderSaving(true);
    try {
      const res = await fetch("/api/settings/ai-provider", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      if (res.ok) toast.success("AI provider updated");
      else toast.error("Failed to update AI provider");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAiProviderSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch("/api/settings/account", { method: "DELETE" });
      if (res.ok) {
        toast.success("Account deleted");
        await signOut({ callbackUrl: "/" });
      } else {
        toast.error("Failed to delete account");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <p className="text-center text-muted-foreground py-10">Loading...</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your business profile and integrations
        </p>
      </div>

      <Tabs defaultValue="whatsapp">
        <TabsList>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="profile">Business Profile</TabsTrigger>
          <TabsTrigger value="hours">Business Hours</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* WhatsApp Connection */}
        <TabsContent value="whatsapp" className="space-y-4">
          {waStatus?.isActive && (
            <>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="py-4 flex items-center gap-3">
                  <Badge className="bg-green-600">Connected</Badge>
                  <span className="text-sm text-green-800">
                    WhatsApp is connected via{" "}
                    <strong>{waStatus.provider}</strong>
                    {waStatus.provider === "META"
                      ? ` (Phone Number ID: ${waStatus.phoneNumberId})`
                      : ` (${waStatus.twilioPhoneNumber})`}
                  </span>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Send Test Message</CardTitle>
                  <CardDescription>
                    Verify your WhatsApp connection by sending a test message
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <Input
                    placeholder="+1234567890"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    disabled={!testPhone || testSending}
                    onClick={async () => {
                      setTestSending(true);
                      try {
                        const res = await fetch("/api/whatsapp/test-send", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ phoneNumber: testPhone }),
                        });
                        const data = await res.json();
                        if (res.ok) toast.success("Test message sent!");
                        else toast.error(data.error || "Failed to send");
                      } catch {
                        toast.error("Network error");
                      } finally {
                        setTestSending(false);
                      }
                    }}
                  >
                    {testSending ? "Sending..." : "Send Test"}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Connect WhatsApp</CardTitle>
              <CardDescription>
                Choose your WhatsApp provider and enter your credentials. Your
                webhook URL is:{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  {typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/whatsapp
                </code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  variant={waProvider === "META" ? "default" : "outline"}
                  onClick={() => setWaProvider("META")}
                  className="flex-1"
                >
                  Meta Cloud API
                </Button>
                <Button
                  variant={waProvider === "TWILIO" ? "default" : "outline"}
                  onClick={() => setWaProvider("TWILIO")}
                  className="flex-1"
                >
                  Twilio
                </Button>
              </div>

              {waProvider === "META" ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>WABA ID</Label>
                    <Input
                      placeholder="WhatsApp Business Account ID"
                      value={wabaId}
                      onChange={(e) => setWabaId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number ID</Label>
                    <Input
                      placeholder="Your phone number ID from Meta"
                      value={phoneNumberId}
                      onChange={(e) => setPhoneNumberId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>System User Access Token</Label>
                    <Input
                      type="password"
                      placeholder="Long-lived access token"
                      value={metaAccessToken}
                      onChange={(e) => setMetaAccessToken(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Set your webhook URL in the Meta App Dashboard under
                    WhatsApp &gt; Configuration. Use the verify token from your
                    environment variables.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Account SID</Label>
                    <Input
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={twilioSid}
                      onChange={(e) => setTwilioSid(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Auth Token</Label>
                    <Input
                      type="password"
                      placeholder="Your Twilio auth token"
                      value={twilioToken}
                      onChange={(e) => setTwilioToken(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp Phone Number</Label>
                    <Input
                      placeholder="+14155238886"
                      value={twilioPhone}
                      onChange={(e) => setTwilioPhone(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Set your webhook URL in Twilio Console under Messaging &gt;
                    WhatsApp Sandbox (or your approved sender).
                  </p>
                </div>
              )}

              <Button onClick={saveWhatsApp} className="w-full">
                {waStatus?.isActive ? "Update" : "Connect"} WhatsApp
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Profile */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>
                Your business information shown to customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input
                  value={profile?.businessName || ""}
                  onChange={(e) =>
                    setProfile(
                      profile
                        ? { ...profile, businessName: e.target.value }
                        : null
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={profile?.phone || ""}
                  onChange={(e) =>
                    setProfile(
                      profile ? { ...profile, phone: e.target.value } : null
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={profile?.address || ""}
                  onChange={(e) =>
                    setProfile(
                      profile ? { ...profile, address: e.target.value } : null
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <TimezoneSelect
                  value={profile?.timezone || "America/New_York"}
                  onChange={(value) =>
                    setProfile(
                      profile ? { ...profile, timezone: value } : null
                    )
                  }
                />
              </div>
              <Button onClick={saveProfile}>Save Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Hours */}
        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>
                Set your working hours for each day. Leave empty for closed
                days.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DAYS.map((day) => (
                <div key={day} className="grid grid-cols-[120px_1fr_1fr] gap-3 items-center">
                  <span className="text-sm font-medium capitalize">{day}</span>
                  <Input
                    type="time"
                    value={profile?.[`${day}Start`] || ""}
                    onChange={(e) => updateHours(day, "Start", e.target.value)}
                    placeholder="09:00"
                  />
                  <Input
                    type="time"
                    value={profile?.[`${day}End`] || ""}
                    onChange={(e) => updateHours(day, "End", e.target.value)}
                    placeholder="17:00"
                  />
                </div>
              ))}
              <Button onClick={saveProfile} className="mt-4">
                Save Hours
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Provider</CardTitle>
              <CardDescription>
                Choose which AI model powers your scheduling assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  variant={aiProvider === "GEMINI" ? "default" : "outline"}
                  onClick={() => saveAiProvider("GEMINI")}
                  disabled={aiProviderSaving}
                  className="flex-1"
                >
                  Gemini
                </Button>
                <Button
                  variant={aiProvider === "OPENAI" ? "default" : "outline"}
                  onClick={() => saveAiProvider("OPENAI")}
                  disabled={aiProviderSaving}
                  className="flex-1"
                >
                  OpenAI
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {aiProvider === "GEMINI"
                  ? "Using Google Gemini 3.1 Flash Lite Preview. Requires GEMINI_API_KEY in your environment."
                  : "Using OpenAI GPT-5 Mini. Requires OPENAI_API_KEY in your environment."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Delete Account</CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                <p className="font-medium mb-2">
                  Deleting your account will permanently remove:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Your profile and business information</li>
                  <li>All services you have created</li>
                  <li>All appointment records</li>
                  <li>All WhatsApp conversation history</li>
                  <li>Your WhatsApp and Google Calendar connections</li>
                </ul>
              </div>
              <Dialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                  setDeleteDialogOpen(open);
                  if (!open) setDeleteConfirmText("");
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                      This will permanently delete your account and remove all
                      your data from our servers. This action is irreversible.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 py-2">
                    <Label>
                      Type <strong>DELETE</strong> to confirm
                    </Label>
                    <Input
                      placeholder="DELETE"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={deleteConfirmText !== "DELETE" || deleting}
                      onClick={handleDeleteAccount}
                    >
                      {deleting ? "Deleting..." : "Permanently Delete Account"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
