"use client";

import * as React from "react";
import { Check, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatBytes } from "@/lib/format";
import { APP } from "@/content/app";

const MAX_FILE_MB = 10;
const DEFAULT_ACCEPT = "application/pdf,image/*,.heic,.heif";

export interface FileDropZoneProps {
  /**
   * Return `false` (or reject) to signal the upload did not actually succeed — anything else
   * (`true`, `undefined`, a resolved promise of either) is treated as success. The box needs this
   * signal itself: it renders a persistent "uploaded" confirmation once `onFile` succeeds,
   * instead of relying only on the caller's own toast, which disappears and left no lasting
   * record of whether a file was actually accepted (founder feedback, 12 Sep 2026).
   */
  onFile: (file: File) => void | boolean | Promise<void | boolean>;
  disabled: boolean;
  hint?: string;
  accept?: string;
  multiple?: boolean;
}

interface UploadedEntry {
  id: number;
  name: string;
  size: number;
}

export function FileDropZone({
  onFile,
  disabled,
  hint,
  accept = DEFAULT_ACCEPT,
  multiple = true,
}: FileDropZoneProps) {
  const [dragging, setDragging] = React.useState(false);
  const [uploaded, setUploaded] = React.useState<UploadedEntry[]>([]);
  const nextId = React.useRef(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const acceptExts = accept
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("."));

  const isAccepted = (file: File): boolean => {
    if (file.type) {
      const typeMatch = accept
        .split(",")
        .map((s) => s.trim())
        .filter((s) => !s.startsWith("."));
      if (typeMatch.some((t) => t === file.type || t === file.type.split("/")[0] + "/*")) {
        return true;
      }
      if (typeMatch.includes(file.type)) return true;
      for (const t of typeMatch) {
        if (t.endsWith("/*") && file.type.startsWith(t.slice(0, -1))) return true;
      }
    }
    if (acceptExts.length > 0) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      return acceptExts.some((a) => a.toLowerCase() === ext);
    }
    return false;
  };

  const handleFiles = (files: FileList | null | undefined) => {
    if (!files) return;
    const fileArray = multiple ? Array.from(files) : [files[0]];
    for (const f of fileArray) {
      if (!f) continue;
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(APP.upload.tooLarge, {
          description: `File must be under ${MAX_FILE_MB} MB.`,
        });
        continue;
      }
      if (!isAccepted(f)) {
        toast.error(APP.upload.wrongType, {
          description: APP.upload.wrongTypeDesc,
        });
        continue;
      }
      void (async () => {
        let ok = true;
        try {
          const result = await onFile(f);
          ok = result !== false;
        } catch {
          // The caller is expected to surface its own error (toast); this box declines to show
          // a false "uploaded" confirmation for a file that didn't actually make it.
          ok = false;
        }
        if (ok) {
          const id = nextId.current++;
          setUploaded((prev) => [{ id, name: f.name, size: f.size }, ...prev]);
        }
      })();
    }
  };

  return (
    // v5 (26 Sep 2026): the prototype's drop strip, a faint diagonal hatch with the action on the
    // right, instead of a centred dashed box.
    <Card
      className={`flex flex-col gap-3 rounded-[16px] p-4 text-sm shadow-none transition-colors [background-image:repeating-linear-gradient(135deg,transparent_0_10px,hsl(var(--muted))_10px_20px)] ${
        dragging ? "border-primary bg-primary/5" : "border-border bg-surface-2"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (disabled) return;
        handleFiles(e.dataTransfer.files);
      }}
    >
      {uploaded.length > 0 && (
        <ul className="w-full space-y-1.5" aria-label={APP.upload.uploadedLabel}>
          {uploaded.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-2 rounded-md border border-success/30 bg-success/5 px-3 py-2 text-left"
            >
              <Check className="size-4 shrink-0 text-success" aria-hidden />
              <span className="sr-only">{APP.upload.uploadedLabel}:</span>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">{u.name}</span>
              <span className="shrink-0 whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground">
                {formatBytes(u.size)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3.5">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-surface-1 shadow-card ring-1 ring-inset ring-border">
          <Upload className="size-[18px] text-foreground" aria-hidden />
        </span>
        {/* A floor on the text's width, so in a narrow column the button wraps below instead. */}
        <div className="min-w-[11rem] flex-1">
          <p className="font-semibold text-foreground">{APP.upload.drop}</p>
          <p className="text-xs text-muted-foreground">{hint ?? APP.upload.maxMb}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            size="sm"
            variant="secondary"
            className="bg-foreground text-background hover:bg-foreground/90"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            {APP.upload.choose}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden [@media(pointer:coarse)]:inline-flex"
            onClick={() => cameraInputRef.current?.click()}
            disabled={disabled}
          >
            {APP.upload.takePhoto}
          </Button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        hidden
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </Card>
  );
}
