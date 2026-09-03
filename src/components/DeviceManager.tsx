"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, MonitorSmartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Device = {
  id: string;
  label: string | null;
  user_agent: string | null;
  first_seen_at: string;
  last_seen_at: string;
  revoked_at: string | null;
};

type DevicesResponse = { devices: Device[]; cap: number };

function fmtDate(s: string): string {
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

export function DeviceManager() {
  const [data, setData] = useState<DevicesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/devices", { cache: "no-store" });
        if (!r.ok) {
          if (!cancelled) {
            setData({ devices: [], cap: 5 });
            setLoading(false);
          }
          return;
        }
        const json = (await r.json()) as DevicesResponse;
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setData({ devices: [], cap: 5 });
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function revoke(deviceId: string) {
    setPendingId(deviceId);
    try {
      const r = await fetch("/api/devices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        toast.error(body.error ?? "Failed to revoke device");
        return;
      }
      toast.success("Device revoked.");
      startTransition(() => {
        setData((prev) =>
          prev ? { ...prev, devices: prev.devices.filter((d) => d.id !== deviceId) } : prev,
        );
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPendingId(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading devices…
          </div>
        </CardContent>
      </Card>
    );
  }

  const devices = data?.devices ?? [];
  const cap = data?.cap ?? 5;

  return (
    <Card>
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-start gap-3">
          <MonitorSmartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1">
            <h2 className="font-medium text-foreground">
              Active devices ({devices.length} of {cap})
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your Appeal Pass works on up to {cap} devices. If you hit the limit, revoke an older
              device to activate a new one.
            </p>
          </div>
        </div>

        {devices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active devices recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {devices.map((d) => (
              <li
                key={d.id}
                className={cn(
                  "flex items-center justify-between gap-3 p-3",
                  pendingId === d.id && "opacity-60",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {d.label ?? "Unknown device"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    First seen {fmtDate(d.first_seen_at)} · Last seen {fmtDate(d.last_seen_at)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revoke(d.id)}
                  disabled={pendingId === d.id}
                  aria-label={`Revoke ${d.label ?? "device"}`}
                >
                  {pendingId === d.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
