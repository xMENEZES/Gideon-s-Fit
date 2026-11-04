// Alerta de tela piscando no fim do descanso: uma piscada por bipe (mesmo ritmo do alarme).
// Fica abaixo de 3 piscadas por segundo, limite de segurança para quem tem sensibilidade a luz
// intermitente (WCAG 2.3.1).
export const MAX_FLASHES_PER_SECOND = 3;

export type FlashEvent = { at: number; on: boolean };

// Liga e desliga a camada de piscada: `pulses` piscadas, uma a cada `stepMs`, cada uma acesa por
// `onMs`. Os tempos são em milissegundos a partir do fim do descanso.
export function flashSchedule(pulses: number, stepMs: number, onMs: number): FlashEvent[] {
  const events: FlashEvent[] = [];
  for (let i = 0; i < pulses; i++) {
    events.push({ at: i * stepMs, on: true });
    events.push({ at: i * stepMs + onMs, on: false });
  }
  return events;
}

// Maior número de piscadas (acendimentos) dentro de qualquer janela de 1 segundo.
export function maxFlashesInOneSecond(events: FlashEvent[]): number {
  const starts = events.filter((event) => event.on).map((event) => event.at);
  return Math.max(0, ...starts.map((start) => starts.filter((at) => at >= start && at < start + 1000).length));
}
