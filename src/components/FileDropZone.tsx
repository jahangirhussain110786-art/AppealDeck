"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP } from "@/content/app";

const MAX_FILE_MB = 10;

export interface FileDropZoneProps {
  onFile: (file: File) => void | Promise<void>;
  disabled: boolean;
  hint?: string;
}

export function FileDropZone({ onFile, disabled, hint }: FileDropZoneProps) {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null | undefined) => {
    const f = files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(APP.interview.fileUpload.tooLarge, {
        description: `File must be under ${MAX_FILE_MB} MB.`,
      });
      return;
    }
    void onFile(f);
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
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        {APP.interview.fileUpload.choose}
      </Button>
      <input
        ref={inputRef}
        type="file"
        hidden
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
