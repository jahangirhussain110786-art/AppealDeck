"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, MonitorSmartphone, Trash2, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { APP } from "@/content/app";
import { IconTile } from "@/components/workspace/WorkspaceVisuals";

const DEVICE_CAP = 5;

type Device = {
  id: string;
  label: string | null;
  user_agent: string | null;
  first_seen_at: string;
  last_seen_at: string;
  revoked_at: string | null;
};

type DevicesResponse = { devices: Device[]; cap: number; currentDeviceId: string | null };

export function DeviceManager() {
  const [data, setData] = useState<DevicesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<Device | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(false);
      try {
        const r = await fetch("/api/devices", { cache: "no-store" });
        if (!r.ok) throw new Error("Device list unavailable");
        const json = (await r.json()) as DevicesResponse;
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoadError(true);
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [loadAttempt]);

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
      setRevoking(null);
    }
  }

  if (loading) {
    return (
      <Card role="status" aria-label={APP.billing.deviceCap.loading}>
        <CardContent className="pt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="flex items-start gap-4 p-5 sm:p-6" role="alert">
        <IconTile icon={WifiOff} tone="warning" />
        <div>
          <h2 className="text-base font-semibold">{APP.billing.deviceCap.loadError}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {APP.billing.deviceCap.loadErrorDesc}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => setLoadAttempt((value) => value + 1)}
          >
            {APP.billing.deviceCap.retry}
          </Button>
        </div>
      </Card>
    );
  }

  const devices = data?.devices ?? [];
  const cap = data?.cap ?? DEVICE_CAP;
  const currentDeviceId = data?.currentDeviceId ?? null;
  const label = (d: Device) => d.label ?? "Unknown device";

  return (
    <>
      {/* v5 (26 Sep 2026): a card with a header row and one hairline row per device. */}
      <Card className="overflow-hidden rounded-[18px] border-0 ring-1 ring-inset ring-border">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-[0.9375rem] font-semibold text-foreground">
            {APP.billing.deviceCap.title}{" "}
            <span
              data-tn
              className="ml-1 whitespace-nowrap text-sm font-normal tabular-nums text-muted-foreground"
            >
              ({devices.length} of {cap})
            </span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {APP.billing.deviceCap.subtitle.replace("{cap}", String(cap))}
          </p>
        </div>
        <CardContent className="p-0">
          {devices.length === 0 ? (
            <EmptyState
              icon={MonitorSmartphone}
              title={APP.billing.deviceCap.none}
              description={APP.billing.deviceCap.noneDesc}
            />
          ) : (
            <div>
              {devices.map((d) => {
                const isCurrent = d.id === currentDeviceId;
                return (
                  <div
                    key={d.id}
                    className={cn(
                      "grid min-w-0 items-center gap-2 border-b border-border px-6 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:gap-4",
                      isCurrent && "bg-primary/[0.04]",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-all text-sm font-medium text-foreground">{label(d)}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground" data-tn>
                          First seen {formatDateTime(d.first_seen_at)}
                        </p>
                      </div>
                      {isCurrent ? (
                        <Badge variant="info" size="sm">
                          {APP.billing.deviceCap.thisDevice}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground" data-tn>
                      Last seen {formatDateTime(d.last_seen_at)}
                    </p>
                    <div className="flex justify-end">
                      {isCurrent ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-auto min-h-9 whitespace-normal py-2"
                                  disabled
                                  aria-label={`Revoke ${label(d)}`}
                                >
                                  <Trash2 className="h-4 w-4" />{" "}
                                  {APP.billing.deviceCap.revokeOwnTooltip}
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {APP.billing.deviceCap.revokeOwnTooltip}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRevoking(d)}
                          disabled={pendingId === d.id}
                          aria-label={`Revoke ${label(d)}`}
                        >
                          {pendingId === d.id ? (
                            <Loader2
                              className="h-4 w-4 animate-spin motion-reduce:animate-none"
                              aria-hidden="true"
                            />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}{" "}
                          {APP.billing.revoke.confirm}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!revoking} onOpenChange={(open) => !open && setRevoking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {APP.billing.revoke.title.replace(
                "{label}",
                label(revoking ?? ({ id: "", label: null } as Device)),
              )}
            </DialogTitle>
            <DialogDescription>{APP.billing.revoke.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRevoking(null)}>
              {APP.billing.revoke.cancel}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => revoking && revoke(revoking.id)}
              disabled={pendingId === revoking?.id}
            >
              {pendingId === revoking?.id && (
                <Loader2
                  className="h-4 w-4 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}
              {APP.billing.revoke.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
