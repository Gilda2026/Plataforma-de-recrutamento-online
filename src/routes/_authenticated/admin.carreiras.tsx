import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listCatalogs, upsertCareer, deleteCareer } from "@/lib/catalog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Printer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/carreiras")({
  component: CareersPage,
});

function CareersPage() {
  const qc = useQueryClient();
  const fn = useServerFn(listCatalogs);
  const up = useServerFn(upsertCareer);
  const del = useServerFn(deleteCareer);
  const { data } = useQuery({ queryKey: ["catalogs"], queryFn: () => fn() });
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const add = async () => {
    if (!name.trim()) return;
    try { await up({ data: { name, description: desc } }); setName(""); setDesc(""); toast.success("Adicionado"); qc.invalidateQueries({ queryKey: ["catalogs"] }); }
    catch (e: any) { toast.error(e.message); }
  };
  const remove = async (id: string) => {
    if (!confirm("Eliminar?")) return;
    await del({ data: { id } }); qc.invalidateQueries({ queryKey: ["catalogs"] });
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Carreiras</h1>
        <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimir</Button>
      </header>
      <Card><CardContent className="p-4 grid gap-2 md:grid-cols-[1fr_2fr_auto]">
        <Input placeholder="Nome da carreira" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Descrição (opcional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <Button onClick={add}>Adicionar</Button>
      </CardContent></Card>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr><th className="p-3">Nome</th><th>Descrição</th><th></th></tr></thead>
          <tbody>
            {(data?.careers ?? []).map((c: any) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="text-muted-foreground">{c.description}</td>
                <td className="p-3 text-right print:hidden"><Button size="sm" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
