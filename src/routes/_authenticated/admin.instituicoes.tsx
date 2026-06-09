import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listCatalogs, upsertInstitution, deleteInstitution } from "@/lib/catalog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/instituicoes")({ component: Inst });

function Inst() {
  const qc = useQueryClient();
  const fn = useServerFn(listCatalogs);
  const up = useServerFn(upsertInstitution);
  const del = useServerFn(deleteInstitution);
  const { data } = useQuery({ queryKey: ["catalogs"], queryFn: () => fn() });
  const [name, setName] = useState(""); const [sector, setSector] = useState("");

  const add = async () => {
    if (!name) return;
    try { await up({ data: { name, sector } }); setName(""); setSector(""); toast.success("Adicionado"); qc.invalidateQueries({ queryKey: ["catalogs"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Instituições / Sectores</h1>
        <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimir</Button>
      </header>
      <Card><CardContent className="p-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
        <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Sector" value={sector} onChange={(e) => setSector(e.target.value)} />
        <Button onClick={add}>Adicionar</Button>
      </CardContent></Card>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr><th className="p-3">Nome</th><th>Sector</th><th></th></tr></thead>
          <tbody>
            {(data?.institutions ?? []).map((i: any) => (
              <tr key={i.id} className="border-t border-border">
                <td className="p-3 font-medium">{i.name}</td>
                <td className="text-muted-foreground">{i.sector}</td>
                <td className="p-3 text-right print:hidden"><Button size="sm" variant="ghost" onClick={() => del({ data: { id: i.id } }).then(() => qc.invalidateQueries({ queryKey: ["catalogs"] }))}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
