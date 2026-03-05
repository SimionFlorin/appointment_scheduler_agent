import Link from "next/link";
import { cn } from "@/lib/utils";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t py-8", className)}>
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>
          BookMe AI | Your AI Receptionist That Never Sleeps &mdash; AI-powered
          appointment scheduling
        </p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <Link
            href="/privacy-policy"
            className="hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <span>|</span>
          <Link
            href="/terms-of-service"
            className="hover:text-foreground transition-colors"
          >
            Terms of Service
          </Link>
          <span>|</span>
          <Link
            href="/data-deletion"
            className="hover:text-foreground transition-colors"
          >
            Data Deletion
          </Link>
        </div>
      </div>
    </footer>
  );
}
