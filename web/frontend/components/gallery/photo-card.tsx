import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { Photo } from "@/api/types";

const backgroundClasses = ["bg-red-block", "bg-blue", "bg-yellow", "bg-pink"];

function formatPhotoDate(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

type PhotoCardProps = {
  photo: Photo;
  eager?: boolean;
};

export function PhotoCard({ photo, eager = false }: PhotoCardProps) {
  const colorIndex = photo.id.split("").reduce((total, character) => total + character.charCodeAt(0), 0);

  return (
    <article className="group min-w-0">
      <div
        className={`relative aspect-square overflow-hidden rounded-primary ${backgroundClasses[colorIndex % backgroundClasses.length]}`}
      >
        <Image
          src={photo.processedUrl}
          alt={photo.title}
          fill
          loading={eager ? "eager" : "lazy"}
          unoptimized={photo.processedUrl.startsWith("data:")}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-all duration-600 group-hover:scale-105 motion-reduce:transition-none"
        />
        <Badge className="absolute left-3 top-3 bg-card text-primary" variant="outline">
          {photo.filterPreset}
        </Badge>
      </div>

      <div className="px-1 pt-4">
        <div className="min-w-0">
          <h3 className="truncate font-display text-xl font-bold text-primary">{photo.title}</h3>
          <p className="mt-1 text-xs font-bold text-muted-foreground">{formatPhotoDate(photo.createdAt)}</p>
        </div>
      </div>
    </article>
  );
}
