import type { ChangeEvent, RefObject } from "react";
import { IconRefresh, IconUpload } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

type UploadPanelProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSelect: () => void;
};

export function UploadPanel({ inputRef, isUploading, onChange, onSelect }: UploadPanelProps) {
  return (
    <div className="rounded-primary border border-primary/30 bg-background p-3">
      <div className="flex items-center gap-4 rounded-[calc(var(--rounded-primary)-0.4rem)] p-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-pill bg-background text-primary">
          <IconUpload size={22} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-black">加入一張照片</p>
          <p className="mt-0.5 text-xs font-bold text-foreground/65">JPEG · 最多 8 MB</p>
        </div>
        <input ref={inputRef} hidden type="file" accept="image/jpeg,.jpg,.jpeg" onChange={onChange} />
        <Button size="sm" onClick={onSelect} disabled={isUploading} aria-label="選擇 JPEG 照片">
          {isUploading ? (
            <IconRefresh className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <IconUpload aria-hidden="true" />
          )}
          <span className="hidden md:inline">{isUploading ? "加入中" : "選擇照片"}</span>
        </Button>
      </div>
    </div>
  );
}
