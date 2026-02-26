"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "profession" | "business" | "done";

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState<Step>("profession");
  const [profession, setProfession] = useState<string>("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profession, businessName, phone, address, timezone }),
      });
      if (!res.ok) throw new Error("Failed to complete onboarding");
      await update();
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex items-center gap-2">
            <CalendarCheck className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">ScheduleAI</span>
          </div>
          <CardTitle>Set up your account</CardTitle>
          <CardDescription>
            {step === "profession"
              ? "What type of professional are you?"
              : "Tell us about your business"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === "profession" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setProfession("DENTIST")}
                  className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-colors hover:border-primary ${
                    profession === "DENTIST"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <span className="text-4xl">🦷</span>
                  <span className="font-semibold">Dentist</span>
                </button>
                <button
                  onClick={() => setProfession("MECHANIC")}
                  className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-colors hover:border-primary ${
                    profession === "MECHANIC"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <span className="text-4xl">🔧</span>
                  <span className="font-semibold">Mechanic</span>
                </button>
              </div>
              <Button
                className="w-full"
                disabled={!profession}
                onClick={() => setStep("business")}
              >
                Continue
              </Button>
            </div>
          )}

          {step === "business" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder={
                    profession === "DENTIST"
                      ? "Bright Smile Dental"
                      : "Quick Fix Auto"
                  }
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Business Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address (optional)</Label>
                <Input
                  id="address"
                  placeholder="123 Main St, City, State"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Auto-detected from your browser
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("profession")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!businessName || loading}
                  onClick={handleComplete}
                >
                  {loading ? "Setting up..." : "Complete Setup"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
