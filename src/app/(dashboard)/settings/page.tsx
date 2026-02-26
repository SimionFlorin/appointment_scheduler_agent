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
import { toast } from "sonner";

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
  const [aiProvider, setAiProvider] = useState<"GEMINI" | "OPENAI">("GEMINI");
  const [loading, setLoading] = useState(true);

  // WhatsApp form
  const [waProvider, setWaProvider] = useState<"META" | "TWILIO">("META");
  const [wabaId, setWabaId] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioPhone, setTwilioPhone] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/profile").then((r) => r.json()),
      fetch("/api/whatsapp/connect").then((r) => r.json()),
      fetch("/api/settings/ai-provider").then((r) => r.json()),
    ]).then(([profileData, waData, aiData]) => {
      setProfile(profileData.profile || null);
      setWaStatus(waData.config || null);
      setAiProvider(aiData.aiProvider || "GEMINI");
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
    if (res.ok) toast.success("Profile updated");
    else toast.error("Failed to update profile");
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

  async function saveAIProvider() {
    const res = await fetch("/api/settings/ai-provider", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiProvider }),
    });
    if (res.ok) toast.success("AI provider updated");
    else toast.error("Failed to update AI provider");
  }

  function updateHours(day: string, field: "Start" | "End", value: string) {
    if (!profile) return;
    setProfile({ ...profile, [`${day}${field}`]: value || null });
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
          <TabsTrigger value="ai">AI Provider</TabsTrigger>
          <TabsTrigger value="profile">Business Profile</TabsTrigger>
          <TabsTrigger value="hours">Business Hours</TabsTrigger>
        </TabsList>

        {/* WhatsApp Connection */}
        <TabsContent value="whatsapp" className="space-y-4">
          {waStatus?.isActive && (
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

        {/* AI Provider */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Provider</CardTitle>
              <CardDescription>
                Choose which AI model to use for your scheduling assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  variant={aiProvider === "GEMINI" ? "default" : "outline"}
                  onClick={() => setAiProvider("GEMINI")}
                  className="flex-1"
                >
                  Google Gemini
                </Button>
                <Button
                  variant={aiProvider === "OPENAI" ? "default" : "outline"}
                  onClick={() => setAiProvider("OPENAI")}
                  className="flex-1"
                >
                  OpenAI (GPT-4)
                </Button>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Google Gemini:</strong> Fast and efficient, optimized for conversation. Free tier available.
                </p>
                <p>
                  <strong>OpenAI GPT-4:</strong> Highly capable model with excellent reasoning. Requires OpenAI API key.
                </p>
                <p className="text-xs mt-2">
                  Note: Make sure you have configured the corresponding API key in your environment variables.
                </p>
              </div>
              <Button onClick={saveAIProvider} className="w-full">
                Save AI Provider
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
                <Input
                  value={profile?.timezone || ""}
                  onChange={(e) =>
                    setProfile(
                      profile ? { ...profile, timezone: e.target.value } : null
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
      </Tabs>
    </div>
  );
}
