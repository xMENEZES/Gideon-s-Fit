"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { inviteTrainerSchema, type InviteTrainerInput } from "@/lib/validations/admin.schema";
import { inviteTrainer } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function InviteTrainerDialog() {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteTrainerInput>({ resolver: zodResolver(inviteTrainerSchema) });

  async function onSubmit(values: InviteTrainerInput) {
    const result = await inviteTrainer(values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Convite enviado! O profissional vai definir o próprio nome e senha ao aceitar.");
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        Novo profissional
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo profissional</DialogTitle>
          <DialogDescription>
            Ele receberá um email para criar o próprio nome e senha e acessar sua conta.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando convite..." : "Convidar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
