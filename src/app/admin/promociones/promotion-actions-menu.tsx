"use client";

import { useTransition } from "react";
import { MoreVertical, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { togglePromotionActive, deletePromotion } from "./actions";

export function PromotionActionsMenu({
  id,
  active,
}: {
  id: number;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await togglePromotionActive(id);
      if ("error" in result) toast.error(result.error);
      else toast.success(active ? "Promoción desactivada" : "Promoción activada");
    });
  }

  function handleDelete() {
    if (!confirm("¿Eliminar esta promoción? Esta acción no se puede deshacer.")) return;
    startTransition(async () => {
      const result = await deletePromotion(id);
      if ("error" in result) toast.error(result.error);
      else toast.success("Promoción eliminada");
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={pending}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleToggle}>
          <Power className="h-4 w-4 mr-2" />
          {active ? "Desactivar" : "Activar"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-700">
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
