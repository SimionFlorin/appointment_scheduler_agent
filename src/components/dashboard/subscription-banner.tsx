"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubscriptionInfo {
  status: string;
  daysLeft: number | null;
  isActive: boolean;
}

export function SubscriptionBanner() {
  const pathname = usePathname();
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/billing")
      .then((r) => r.json())
      .then((data) => setSub(data.subscription))
      .catch(() => {});
  }, []);

  if (!sub || dismissed || pathname === "/billing") return null;

  if (sub.status === "trialing" && sub.daysLeft !== null && sub.daysLeft <= 7) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <Clock className="h-4 w-4" />
            <span>
              Your free trial ends in{" "}
              <strong>
                {sub.daysLeft} day{sub.daysLeft !== 1 ? "s" : ""}
              </strong>
              .
            </span>
            <Link href="/billing">
              <Button variant="link" size="sm" className="text-amber-900 p-0 h-auto font-semibold">
                Subscribe now
              </Button>
            </Link>
          </div>
          <button onClick={() => setDismissed(true)} className="text-amber-600 hover:text-amber-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!sub.isActive && sub.status !== "trialing") {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-2">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-red-800">
            <AlertTriangle className="h-4 w-4" />
            <span>
              Your subscription has expired. Features are limited until you
              subscribe.
            </span>
            <Link href="/billing">
              <Button variant="link" size="sm" className="text-red-900 p-0 h-auto font-semibold">
                Reactivate now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
