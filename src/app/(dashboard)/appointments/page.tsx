"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { toast } from "sonner";

interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  service: {
    name: string;
    price: number;
    duration: number;
  };
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  SCHEDULED: "default",
  CONFIRMED: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
  NO_SHOW: "outline",
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");

  async function load() {
    setLoading(true);
    const params =
      filter === "upcoming"
        ? "?upcoming=true"
        : filter === "all"
          ? ""
          : `?status=${filter}`;
    const res = await fetch(`/api/appointments${params}`);
    const data = await res.json();
    setAppointments(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/appointments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      toast.success(`Appointment marked as ${status.toLowerCase()}`);
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Appointments</h1>
        <p className="text-muted-foreground">
          View and manage appointments booked through WhatsApp
        </p>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
          <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <p className="text-muted-foreground text-center py-10">Loading...</p>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No appointments found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <Card key={apt.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{apt.customerName}</p>
                      <Badge variant={statusColors[apt.status] || "secondary"}>
                        {apt.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {apt.service.name} &mdash; ${apt.service.price}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {apt.customerPhone}
                    </p>
                  </div>
                  <div className="text-sm text-right space-y-1">
                    <p className="font-medium">
                      {format(new Date(apt.startTime), "EEEE, MMM d, yyyy")}
                    </p>
                    <p className="text-muted-foreground">
                      {format(new Date(apt.startTime), "h:mm a")} -{" "}
                      {format(new Date(apt.endTime), "h:mm a")}
                    </p>
                  </div>
                  {(apt.status === "SCHEDULED" ||
                    apt.status === "CONFIRMED") && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(apt.id, "COMPLETED")}
                      >
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatus(apt.id, "CANCELLED")}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
