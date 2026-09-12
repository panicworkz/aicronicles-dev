"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { onayla } from "@/components/ui/modal";
import { toast } from "sonner";

/**
 * Sepet kaydini siler.
 *
 * Onay isteniyor: kayit kisisel veri tasiyabiliyor ve geri getirmenin
 * yolu yok. Tek tikla silinen bir sey, yanlislikla silinen bir sey.
 */
export function SepetSil({ id }: { id: number }) {
  const router = useRouter();
  const [siliniyor, setSiliniyor] = React.useState(false);

  const sil = async () => {
    const onay = await onayla({
      baslik: "Delete this basket record?",
      aciklama:
        "What was in it, and the name and email if they were given, are removed. This cannot be undone.",
      onayYazisi: "Delete record",
      yikici: true,
    });
    if (!onay) return;

    setSiliniyor(true);
    try {
      const y = await fetch(`/api/cart/${id}`, { method: "DELETE" });
      const d = await y.json();
      if (!d?.success) throw new Error();
      toast.success("Basket record deleted");
      router.refresh();
    } catch {
      toast.error("Could not delete the record");
    } finally {
      setSiliniyor(false);
    }
  };

  return (
    <button
      type="button"
      onClick={sil}
      disabled={siliniyor}
      title="Delete this basket record"
      className="cursor-pointer text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}
