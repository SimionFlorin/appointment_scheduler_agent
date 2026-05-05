"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SessionInfoData {
  phone_number_id?: string;
  waba_id?: string;
  business_id?: string;
}

interface SessionInfoMessage {
  type: "WA_EMBEDDED_SIGNUP";
  event: "FINISH" | "CANCEL" | "ERROR";
  data: SessionInfoData;
  version?: string;
}

interface FbLoginResponse {
  authResponse?: { code?: string; accessToken?: string } | null;
  status?: string;
}

interface FbLoginOptions {
  config_id?: string;
  response_type?: string;
  override_default_response_type?: boolean;
  extras?: Record<string, unknown>;
  scope?: string;
}

declare global {
  interface Window {
    FB?: {
      login: (
        callback: (response: FbLoginResponse) => void,
        options: FbLoginOptions
      ) => void;
    };
  }
}

interface WhatsAppEmbeddedSignupProps {
  onSuccess?: () => void;
  className?: string;
  label?: string;
}

export function WhatsAppEmbeddedSignup({
  onSuccess,
  className,
  label = "Connect WhatsApp",
}: WhatsAppEmbeddedSignupProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const sessionInfoRef = useRef<SessionInfoData | null>(null);

  const configId = process.env.NEXT_PUBLIC_WHATSAPP_ES_CONFIG_ID;

  // The FB SDK is loaded with strategy="lazyOnload" in src/app/layout.tsx, so
  // window.FB may not be available on first render. Poll until it is.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.FB) {
      setSdkReady(true);
      return;
    }
    const interval = window.setInterval(() => {
      if (window.FB) {
        setSdkReady(true);
        window.clearInterval(interval);
      }
    }, 500);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function onMessage(event: MessageEvent) {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      ) {
        return;
      }
      try {
        const raw =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        const msg = raw as SessionInfoMessage;
        if (!msg || msg.type !== "WA_EMBEDDED_SIGNUP") return;

        if (msg.event === "FINISH") {
          sessionInfoRef.current = msg.data;
        } else if (msg.event === "CANCEL") {
          sessionInfoRef.current = null;
          toast.message("WhatsApp signup cancelled");
        } else if (msg.event === "ERROR") {
          sessionInfoRef.current = null;
          console.error("[WA:es] Embedded Signup error", msg.data);
          toast.error("WhatsApp signup error");
        }
      } catch {
        // Non-JSON or unrelated postMessage; ignore.
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const launch = useCallback(() => {
    if (!window.FB) {
      toast.error("Facebook SDK not loaded yet — please retry in a moment");
      return;
    }
    if (!configId) {
      toast.error(
        "Embedded Signup is not configured. Set NEXT_PUBLIC_WHATSAPP_ES_CONFIG_ID."
      );
      return;
    }

    sessionInfoRef.current = null;

    window.FB.login(
      async (response) => {
        const code = response.authResponse?.code;
        if (!code) {
          // No code typically means the popup was closed without finishing.
          // The CANCEL postMessage handler above already toasts.
          return;
        }
        const session = sessionInfoRef.current;
        if (!session?.phone_number_id || !session?.waba_id) {
          toast.error(
            "WhatsApp signup did not return a phone number ID or WABA ID"
          );
          return;
        }

        setSubmitting(true);
        try {
          const res = await fetch("/api/whatsapp/embedded-signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code,
              wabaId: session.waba_id,
              phoneNumberId: session.phone_number_id,
            }),
          });
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
            success?: boolean;
          };
          if (!res.ok) {
            toast.error(data?.error || "Failed to connect WhatsApp");
            return;
          }
          toast.success("WhatsApp connected");
          onSuccess?.();
        } catch (err) {
          console.error("[WA:es] connect failed", err);
          toast.error("Network error connecting WhatsApp");
        } finally {
          setSubmitting(false);
        }
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: { sessionInfoVersion: "3" },
      }
    );
  }, [configId, onSuccess]);

  return (
    <Button
      type="button"
      onClick={launch}
      disabled={!sdkReady || submitting}
      className={className}
      title={sdkReady ? undefined : "Loading Facebook SDK..."}
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      {submitting ? "Connecting..." : sdkReady ? label : "Loading SDK..."}
    </Button>
  );
}
