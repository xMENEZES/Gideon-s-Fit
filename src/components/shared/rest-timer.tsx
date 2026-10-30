"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Aviso do fim do descanso: 6 bipes e 6 pulsos de vibração, cerca de 3 segundos no total.
const ALARM_BEEPS = 6;
const BEEP_STEP_S = 0.5;
const BEEP_LENGTH_S = 0.3;
const ALARM_VIBRATION_MS = [350, 180, 350, 180, 350, 180, 350, 180, 350, 180, 350];

// O navegador só libera o áudio depois de um toque: o contexto nasce no "Iniciar" (um toque) e é
// usado no fim da contagem.
function createAudioContext(): AudioContext | null {
  try {
    const AudioContextCtor =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return null;
    const ctx = new AudioContextCtor();
    void ctx.resume();
    return ctx;
  } catch {
    // ambiente sem suporte a Web Audio; ignora
    return null;
  }
}

function playAlarm(ctx: AudioContext | null) {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(ALARM_VIBRATION_MS);
  if (!ctx) return;
  try {
    void ctx.resume();
    for (let i = 0; i < ALARM_BEEPS; i++) {
      const start = ctx.currentTime + i * BEEP_STEP_S;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.value = i % 2 === 0 ? 880 : 1175;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.25, start);
      gain.gain.setValueAtTime(0, start + BEEP_LENGTH_S);
      oscillator.start(start);
      oscillator.stop(start + BEEP_LENGTH_S);
    }
    window.setTimeout(() => void ctx.close(), (ALARM_BEEPS * BEEP_STEP_S + 0.5) * 1000);
  } catch {
    // ambiente sem suporte a Web Audio; ignora
  }
}

export function RestTimer({ seconds }: { seconds: number }) {
  const [prevSeconds, setPrevSeconds] = useState(seconds);
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  // Instante em que a contagem termina: o tempo vem do relógio (não de "um segundo por tick"),
  // então não atrasa se o navegador reduzir a frequência com a tela em segundo plano.
  const endAtRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);

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
      const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        setRunning(false);
        playAlarm(audioRef.current);
        audioRef.current = null;
      }
    }, 250);
    return () => clearInterval(interval);
  }, [running]);

  useEffect(() => {
    return () => {
      void audioRef.current?.close();
    };
  }, []);

  const isDone = remaining === 0;

  function releaseAudio() {
    void audioRef.current?.close();
    audioRef.current = null;
  }

  function start(from: number) {
    releaseAudio();
    audioRef.current = createAudioContext();
    endAtRef.current = Date.now() + from * 1000;
    setRemaining(from);
    setRunning(true);
  }

  function handleToggle() {
    if (isDone) {
      start(seconds);
    } else if (running) {
      setRunning(false);
      releaseAudio();
    } else {
      start(remaining);
    }
  }

  function handleReset() {
    setRunning(false);
    releaseAudio();
    setRemaining(seconds);
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
      <span className={`font-mono text-lg tabular-nums ${isDone ? "text-primary-ink" : ""}`}>
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
