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

// Id de vídeo do YouTube: 11 caracteres de [A-Za-z0-9_-]. Qualquer outra coisa (barras,
// pontos, parâmetros) é recusada, para não montar um endereço de embed fora do esperado.
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

function isYoutubeHost(hostname: string, domain: string) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function getYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    let id: string | null = null;
    if (isYoutubeHost(parsed.hostname, "youtu.be")) {
      id = parsed.pathname.slice(1);
    } else if (isYoutubeHost(parsed.hostname, "youtube.com")) {
      if (parsed.pathname === "/watch") id = parsed.searchParams.get("v");
      else if (parsed.pathname.startsWith("/shorts/")) id = parsed.pathname.split("/shorts/")[1];
      else if (parsed.pathname.startsWith("/embed/")) id = parsed.pathname.split("/embed/")[1];
    }
    return id && YOUTUBE_ID.test(id) ? id : null;
  } catch {
    return null;
  }
}

// Só links http e https viram link clicável (defesa extra além da validação ao salvar).
function isSafeLink(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
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

  if (!isSafeLink(url)) return null;

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
