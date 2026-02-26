import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const [
    totalAppointments,
    upcomingAppointments,
    totalConversations,
    activeServices,
    recentAppointments,
  ] = await Promise.all([
    prisma.appointment.count({ where: { userId } }),
    prisma.appointment.count({
      where: {
        userId,
        startTime: { gte: new Date() },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
    }),
    prisma.conversation.count({ where: { userId } }),
    prisma.service.count({ where: { userId, isActive: true } }),
    prisma.appointment.findMany({
      where: {
        userId,
        startTime: { gte: new Date() },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      include: { service: true },
      orderBy: { startTime: "asc" },
      take: 5,
    }),
  ]);

  const whatsappConfig = await prisma.whatsAppConfig.findUnique({
    where: { userId },
    select: { isActive: true, provider: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your scheduling activity
        </p>
      </div>

      {/* Status banner */}
      {!whatsappConfig?.isActive && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <p className="text-sm text-amber-800">
              WhatsApp is not connected. Go to{" "}
              <a href="/settings" className="underline font-medium">
                Settings
              </a>{" "}
              to connect your WhatsApp Business account and start receiving
              bookings.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Appointments
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Conversations
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Services
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeServices}</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No upcoming appointments. They will appear here once customers
              book through WhatsApp.
            </p>
          ) : (
            <div className="space-y-3">
              {recentAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{apt.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {apt.service.name} &mdash; ${apt.service.price}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-medium">
                      {format(new Date(apt.startTime), "MMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(apt.startTime), "h:mm a")} -{" "}
                      {format(new Date(apt.endTime), "h:mm a")}
                    </p>
                  </div>
                  <Badge
                    variant={
                      apt.status === "CONFIRMED" ? "default" : "secondary"
                    }
                  >
                    {apt.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
