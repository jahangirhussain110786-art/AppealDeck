"use client";

import * as React from "react";
import { Check, Plus } from "lucide-react";
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
        toast.error(APP.interview.fileUpload.tooLarge, {
          description: `File must be under ${MAX_FILE_MB} MB.`,
        });
        continue;
      }
      if (!isAccepted(f)) {
        toast.error(APP.interview.fileUpload.wrongType, {
          description: APP.interview.fileUpload.wrongTypeDesc,
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
    <Card
      className={`flex flex-col items-center justify-center gap-2 border-dashed p-6 text-sm transition-colors ${
        dragging ? "border-primary bg-accent/10" : "border-border"
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
        <ul className="w-full space-y-1.5" aria-label={APP.interview.fileUpload.uploadedLabel}>
          {uploaded.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-2 rounded-md border border-success/30 bg-success/5 px-3 py-2 text-left"
            >
              <Check className="size-4 shrink-0 text-success" aria-hidden />
              <span className="sr-only">{APP.interview.fileUpload.uploadedLabel}:</span>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">{u.name}</span>
              <span className="shrink-0 whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground">
                {formatBytes(u.size)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Plus className="size-5 text-muted-foreground" />
      <p className="text-muted-foreground">{APP.interview.fileUpload.drop}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          {APP.interview.fileUpload.choose}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="hidden [@media(pointer:coarse)]:inline-flex"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
        >
          {APP.interview.fileUpload.takePhoto}
        </Button>
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
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {!hint && <p className="text-xs text-muted-foreground">{APP.interview.fileUpload.maxMb}</p>}
    </Card>
  );
}
