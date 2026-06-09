import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listCatalogs, upsertOccupation, deleteOccupation } from "@/lib/catalog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/ocupacoes")({ component: OccPage });

function OccPage() {
  const qc = useQueryClient();
  const fn = useServerFn(listCatalogs);
  const up = useServerFn(upsertOccupation);
  const del = useServerFn(deleteOccupation);
  const { data } = useQuery({ queryKey: ["catalogs"], queryFn: () => fn() });
  const [career, setCareer] = useState("");
  const [name, setName] = useState("");

  const add = async () => {
    if (!career || !name.trim()) return toast.error("Carreira e nome são obrigatórios");
    try { await up({ data: { career_id: career, name } }); setName(""); toast.success("Adicionado"); qc.invalidateQueries({ queryKey: ["catalogs"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Ocupações profissionais</h1>
      <Card><CardContent className="p-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
        <Select value={career} onValueChange={setCareer}>
          <SelectTrigger><SelectValue placeholder="Carreira" /></SelectTrigger>
          <SelectContent>{(data?.careers ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Nome da ocupação" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={add}>Adicionar</Button>
      </CardContent></Card>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr><th className="p-3">Carreira</th><th>Ocupação</th><th></th></tr></thead>
          <tbody>
            {(data?.occupations ?? []).map((o: any) => {
              const c = (data?.careers ?? []).find((x: any) => x.id === o.career_id);
              return (
                <tr key={o.id} className="border-t border-border">
                  <td className="p-3 text-muted-foreground">{c?.name}</td>
                  <td className="font-medium">{o.name}</td>
                  <td className="p-3 text-right"><Button size="sm" variant="ghost" onClick={() => del({ data: { id: o.id } }).then(() => qc.invalidateQueries({ queryKey: ["catalogs"] }))}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
