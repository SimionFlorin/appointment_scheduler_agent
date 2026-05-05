"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CreditCard } from "lucide-react";

const UNGATED_PATHS = ["/billing", "/settings", "/onboarding"];

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [blocked, setBlocked] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const isUngated = UNGATED_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (isUngated) {
      setBlocked(false);
      setChecked(true);
      return;
    }

    fetch("/api/billing")
      .then((r) => r.json())
      .then((data) => {
        setBlocked(!data.subscription?.isActive);
        setChecked(true);
      })
      .catch(() => {
        setChecked(true);
      });
  }, [pathname]);

  if (!checked) return null;

  if (blocked) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="max-w-md w-full border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Subscription Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Your free trial has ended. Subscribe to continue using BookMe AI
              and managing your appointments.
            </p>
            <Link href="/billing">
              <Button className="w-full">
                <CreditCard className="mr-2 h-4 w-4" />
                View Plans & Subscribe
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" className="w-full">
                Go to Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
