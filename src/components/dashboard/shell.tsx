"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  CalendarCheck,
  LayoutDashboard,
  Wrench,
  Calendar,
  Settings,
  MessageSquare,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/services", label: "Services", icon: Wrench },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface DashboardShellProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <CalendarCheck className="h-6 w-6 text-primary" />
              <span className="font-bold hidden sm:inline">ScheduleAI</span>
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className="gap-2"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="hidden md:inline">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.image || undefined} />
                  <AvatarFallback>
                    {user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm hidden sm:inline">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-sm text-muted-foreground">
                {user.email}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
