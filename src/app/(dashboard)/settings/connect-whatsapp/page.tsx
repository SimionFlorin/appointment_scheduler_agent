"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

declare global {
  interface Window {
    FB: {
      init: (params: Record<string, unknown>) => void;
      login: (
        callback: (response: FBLoginResponse) => void,
        params: Record<string, unknown>
      ) => void;
    };
    fbAsyncInit: () => void;
  }
}

interface FBLoginResponse {
  authResponse?: {
    code: string;
    accessToken?: string;
    userID?: string;
  };
  status: string;
}

interface EmbeddedSignupData {
  type: string;
  data: {
    phone_number_id: string;
    waba_id: string;
    business_id?: string;
  };
  event: string;
  version: number;
}

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID!;
const META_CONFIG_ID = process.env.NEXT_PUBLIC_META_CONFIG_ID!;
const META_GRAPH_VERSION =
  process.env.NEXT_PUBLIC_META_GRAPH_VERSION || "v25.0";

type FlowState = "idle" | "waiting" | "submitting" | "success" | "error";

export default function ConnectWhatsAppPage() {
  const router = useRouter();
  const [state, setState] = useState<FlowState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const sdkLoaded = useRef(false);

  /**
   * The Embedded Signup popup fires two independent signals:
   * 1. A `message` event with WABA/phone data
   * 2. The `FB.login` callback with the exchangeable code
   *
   * They can arrive in either order. We collect both in refs,
   * and only POST to /onboard when we have both.
   */
  const signupDataRef = useRef<EmbeddedSignupData["data"] | null>(null);
  const codeRef = useRef<string | null>(null);
  const submittedRef = useRef(false);

  const submitOnboard = useCallback(
    async (
      code: string,
      data: { waba_id: string; phone_number_id: string; business_id?: string }
    ) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setState("submitting");

      try {
        const res = await fetch("/api/whatsapp/onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            waba_id: data.waba_id,
            phone_number_id: data.phone_number_id,
            business_id: data.business_id,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(err.error || `Server returned ${res.status}`);
        }

        setState("success");
        toast.success("WhatsApp connected successfully!");
        setTimeout(() => router.push("/settings"), 1500);
      } catch (err) {
        setState("error");
        const message =
          err instanceof Error ? err.message : "Onboarding failed";
        setErrorMsg(message);
        toast.error(message);
        submittedRef.current = false;
      }
    },
    [router]
  );

  const trySubmit = useCallback(() => {
    if (codeRef.current && signupDataRef.current) {
      submitOnboard(codeRef.current, signupDataRef.current);
    }
  }, [submitOnboard]);

  useEffect(() => {
    if (sdkLoaded.current) return;
    sdkLoaded.current = true;

    // Listen for the Embedded Signup `message` event from the popup
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      ) {
        return;
      }

      try {
        const data =
          typeof event.data === "string"
            ? JSON.parse(event.data)
            : event.data;

        if (data.type === "WA_EMBEDDED_SIGNUP") {
          signupDataRef.current = data.data;
          console.log("[ES] WA_EMBEDDED_SIGNUP message received", data.data);
          trySubmit();
        }
      } catch {
        // Not a JSON message we care about
      }
    };
    window.addEventListener("message", handleMessage);

    // Load Facebook JS SDK
    window.fbAsyncInit = () => {
      window.FB.init({
        appId: META_APP_ID,
        cookie: true,
        xfbml: true,
        version: META_GRAPH_VERSION,
      });
    };

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [trySubmit]);

  function launchEmbeddedSignup() {
    if (!window.FB) {
      toast.error("Facebook SDK not loaded yet. Please wait a moment.");
      return;
    }

    setState("waiting");
    setErrorMsg("");
    signupDataRef.current = null;
    codeRef.current = null;
    submittedRef.current = false;

    window.FB.login(
      (response: FBLoginResponse) => {
        if (response.authResponse?.code) {
          codeRef.current = response.authResponse.code;
          console.log("[ES] FB.login callback received code");
          trySubmit();
        } else {
          console.warn("[ES] FB.login: no code in response", response);
          if (state === "waiting") {
            setState("idle");
            toast.error("Facebook login was cancelled or failed.");
          }
        }
      },
      {
        config_id: META_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "",
          sessionInfoVersion: "3",
        },
      }
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Connect WhatsApp</h1>
        <p className="text-muted-foreground">
          Link your WhatsApp Business Account so customers can book appointments
          through WhatsApp.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Business Signup</CardTitle>
          <CardDescription>
            Click the button below to open Meta&apos;s signup flow. You&apos;ll
            be able to create or select your WhatsApp Business Account and
            verify your phone number.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "success" ? (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
              WhatsApp connected! Redirecting to settings...
            </div>
          ) : state === "error" ? (
            <>
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
                {errorMsg || "Something went wrong. Please try again."}
              </div>
              <Button onClick={launchEmbeddedSignup} className="w-full">
                Try Again
              </Button>
            </>
          ) : (
            <Button
              onClick={launchEmbeddedSignup}
              disabled={state === "waiting" || state === "submitting"}
              className="w-full"
              size="lg"
            >
              {state === "waiting"
                ? "Waiting for Facebook..."
                : state === "submitting"
                  ? "Connecting..."
                  : "Connect with Facebook"}
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            You&apos;ll be redirected to Facebook to authenticate and set up
            your WhatsApp Business Account. Make sure pop-ups are enabled.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
