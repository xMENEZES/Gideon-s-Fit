"use client";

import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function getYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1) || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/shorts/")[1] ?? null;
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/embed/")[1] ?? null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function VideoEmbed({ url }: { url: string }) {
  const youtubeId = getYoutubeId(url);

  if (youtubeId) {
    return (
      <Dialog>
        <DialogTrigger
          render={
            <Button variant="outline" size="sm">
              <PlayCircle />
              Ver vídeo do exercício
            </Button>
          }
        />
        <DialogContent className="w-[500px] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Vídeo do exercício</DialogTitle>
          </DialogHeader>
          <div className="aspect-square w-full overflow-hidden rounded-lg border border-border">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title="Vídeo do exercício"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
    >
      <PlayCircle className="size-4" />
      Ver vídeo do exercício
    </a>
  );
}
