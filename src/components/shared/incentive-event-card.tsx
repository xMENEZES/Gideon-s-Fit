"use client";

import { useState } from "react";
import { Check, Copy, Pencil, Plus, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import {
  addIncentiveMessage,
  customizeIncentiveEvent,
  deleteIncentiveMessage,
  resetIncentiveEvent,
  updateIncentiveMessage,
} from "@/lib/actions/incentive";
import { MESSAGE_MAX } from "@/lib/incentive";
import type { IncentiveEvent } from "@/lib/types/database.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";

export type MessageRow = { id: string; body: string; active: boolean };

function OwnMessage({ message }: { message: MessageRow }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(message.body);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    const result = await updateIncentiveMessage(message.id, { body: text });
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setEditing(false);
  }

  async function toggle(active: boolean) {
    const result = await updateIncentiveMessage(message.id, { active });
    if (result?.error) toast.error(result.error);
  }

  return (
    <li className="flex items-start gap-2 rounded-lg border border-border px-3 py-2">
      <Checkbox
        checked={message.active}
        onCheckedChange={(checked) => toggle(!!checked)}
        aria-label={message.active ? "Desativar mensagem" : "Ativar mensagem"}
        className="mt-1"
      />
      {editing ? (
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Input
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={MESSAGE_MAX}
            aria-label="Texto da mensagem"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={pending} type="button">
              <Check />
              Salvar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => {
                setText(message.body);
                setEditing(false);
              }}
            >
              <X />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className={`min-w-0 flex-1 text-sm ${message.active ? "" : "text-muted-foreground line-through"}`}>
            {message.body}
          </p>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            type="button"
            title="Editar mensagem"
            onClick={() => setEditing(true)}
          >
            <Pencil />
          </Button>
          <ConfirmDeleteButton
            action={() => deleteIncentiveMessage(message.id)}
            confirmMessage="Excluir esta mensagem?"
          />
        </>
      )}
    </li>
  );
}

export function IncentiveEventCard({
  event,
  title,
  hint,
  system,
  own,
}: {
  event: IncentiveEvent;
  title: string;
  hint: string;
  system: MessageRow[];
  own: MessageRow[];
}) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);

  const ownActive = own.filter((message) => message.active).length;
  const usingOwn = ownActive > 0;

  async function run(action: () => Promise<{ error?: string } | undefined>) {
    setPending(true);
    const result = await action();
    setPending(false);
    if (result?.error) toast.error(result.error);
    return !result?.error;
  }

  async function add() {
    if (await run(() => addIncentiveMessage(event, draft))) setDraft("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{hint}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="rounded-lg bg-muted px-3 py-2 text-sm">
          {usingOwn
            ? `Seus alunos veem as suas mensagens (${ownActive} ${ownActive === 1 ? "ativa" : "ativas"}).`
            : own.length > 0
              ? "Todas as suas mensagens estão desativadas: seus alunos veem as padrão do sistema."
              : "Seus alunos veem as mensagens padrão do sistema."}
        </p>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Padrão do sistema</p>
          <ul className="flex flex-col gap-1.5">
            {system.map((message) => (
              <li key={message.id} className="rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                {message.body}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Suas mensagens</p>
            {own.length === 0 ? (
              <Button
                size="sm"
                variant="outline"
                type="button"
                disabled={pending}
                onClick={() => run(() => customizeIncentiveEvent(event))}
              >
                <Copy />
                Personalizar a partir do padrão
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                type="button"
                disabled={pending}
                onClick={() => {
                  if (window.confirm("Apagar as suas mensagens e voltar ao padrão do sistema?")) {
                    run(() => resetIncentiveEvent(event));
                  }
                }}
              >
                <RotateCcw />
                Voltar ao padrão
              </Button>
            )}
          </div>

          {own.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {own.map((message) => (
                <OwnMessage key={`${message.id}:${message.body}:${message.active}`} message={message} />
              ))}
            </ul>
          )}

          <form
            className="flex gap-2"
            onSubmit={(submitEvent) => {
              submitEvent.preventDefault();
              if (draft.trim()) add();
            }}
          >
            <Input
              value={draft}
              onChange={(inputEvent) => setDraft(inputEvent.target.value)}
              maxLength={MESSAGE_MAX}
              placeholder="Escreva uma nova mensagem"
              aria-label={`Nova mensagem: ${title}`}
            />
            <Button type="submit" size="sm" disabled={pending || !draft.trim()}>
              <Plus />
              Adicionar
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            Até {MESSAGE_MAX} caracteres. Use {"{nome}"} para o nome do aluno. Com mais de uma mensagem
            ativa, cada aluno vê uma por dia.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
