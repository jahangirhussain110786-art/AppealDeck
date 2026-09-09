"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP } from "@/content/app";

const MAX_FILE_MB = 10;
const DEFAULT_ACCEPT = "application/pdf,image/*,.heic,.heif";

export interface FileDropZoneProps {
  onFile: (file: File) => void | Promise<void>;
  disabled: boolean;
  hint?: string;
  accept?: string;
  multiple?: boolean;
}

export function FileDropZone({
  onFile,
  disabled,
  hint,
  accept = DEFAULT_ACCEPT,
  multiple = true,
}: FileDropZoneProps) {
  const [dragging, setDragging] = React.useState(false);
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
      void onFile(f);
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
