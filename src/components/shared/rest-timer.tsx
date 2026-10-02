"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function playBeep() {
  try {
    const AudioContextCtor =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = new AudioContextCtor();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.value = 880;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.3);
    oscillator.onended = () => ctx.close();
  } catch {
    // ambiente sem suporte a Web Audio; ignora
  }
}

export function RestTimer({ seconds }: { seconds: number }) {
  const [prevSeconds, setPrevSeconds] = useState(seconds);
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);

  // Ajusta o estado durante a renderização (em vez de um efeito) quando o
  // profissional muda o descanso do exercício: reinicia o cronômetro.
  if (seconds !== prevSeconds) {
    setPrevSeconds(seconds);
    setRemaining(seconds);
    setRunning(false);
  }

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          playBeep();
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(300);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const isDone = remaining === 0;

  function handleToggle() {
    if (isDone) {
      setRemaining(seconds);
      setRunning(true);
    } else {
      setRunning((prev) => !prev);
    }
  }

  function handleReset() {
    setRunning(false);
    setRemaining(seconds);
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
      <span className={`font-mono text-lg tabular-nums ${isDone ? "text-primary" : ""}`}>
        {formatTime(remaining)}
      </span>
      <span className="text-xs text-muted-foreground">descanso</span>
      <div className="ml-auto flex items-center gap-1">
        <Button type="button" size="sm" variant="outline" onClick={handleToggle}>
          {running ? <Pause /> : <Play />}
          {running ? "Pausar" : isDone ? "Reiniciar" : "Iniciar"}
        </Button>
        {remaining !== seconds && (
          <Button type="button" size="icon-sm" variant="ghost" onClick={handleReset} title="Reiniciar">
            <RotateCcw />
          </Button>
        )}
      </div>
    </div>
  );
}
