"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  isActive: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  async function loadServices() {
    const res = await fetch("/api/services");
    const data = await res.json();
    setServices(data);
    setLoading(false);
  }

  useEffect(() => {
    loadServices();
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setPrice("");
    setDuration("");
    setDialogOpen(true);
  }

  function openEdit(service: Service) {
    setEditing(service);
    setName(service.name);
    setDescription(service.description || "");
    setPrice(service.price.toString());
    setDuration(service.duration.toString());
    setDialogOpen(true);
  }

  async function handleSave() {
    const method = editing ? "PUT" : "POST";
    const body = editing
      ? { id: editing.id, name, description, price, duration }
      : { name, description, price, duration };

    const res = await fetch("/api/services", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success(editing ? "Service updated" : "Service created");
      setDialogOpen(false);
      loadServices();
    } else {
      toast.error("Failed to save service");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this service?")) return;

    const res = await fetch(`/api/services?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Service deleted");
      loadServices();
    } else {
      toast.error("Failed to delete service");
    }
  }

  async function toggleActive(service: Service) {
    const newIsActive = !service.isActive;

    setServices((prev) =>
      prev.map((s) => (s.id === service.id ? { ...s, isActive: newIsActive } : s))
    );

    const res = await fetch("/api/services", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: service.id, isActive: newIsActive }),
    });

    if (!res.ok) {
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, isActive: !newIsActive } : s))
      );
      toast.error("Failed to update service");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground">
            Manage the services you offer. Customers will see these when booking
            via WhatsApp.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Service" : "New Service"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="Routine Cleaning"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Professional teeth cleaning and polishing"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    placeholder="120"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    placeholder="45"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleSave}
                disabled={!name || !price || !duration}
              >
                {editing ? "Update" : "Create"} Service
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No services yet. Add your first service to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card
              key={service.id}
              className={!service.isActive ? "opacity-60" : ""}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(service)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {service.description && (
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-lg">
                    ${service.price}
                  </span>
                  <span className="text-muted-foreground">
                    {service.duration} min
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <Switch
                    checked={service.isActive}
                    onCheckedChange={() => toggleActive(service)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
