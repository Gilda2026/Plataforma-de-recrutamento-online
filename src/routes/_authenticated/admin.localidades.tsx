import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listCatalogs, upsertProvince, deleteProvince, upsertDistrict, deleteDistrict } from "@/lib/catalog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/localidades")({ component: Loc });

function Loc() {
  const qc = useQueryClient();
  const fn = useServerFn(listCatalogs);
  const upP = useServerFn(upsertProvince); const delP = useServerFn(deleteProvince);
  const upD = useServerFn(upsertDistrict); const delD = useServerFn(deleteDistrict);
  const { data } = useQuery({ queryKey: ["catalogs"], queryFn: () => fn() });
  const [pName, setPName] = useState("");
  const [dProv, setDProv] = useState(""); const [dName, setDName] = useState("");
  const inv = () => qc.invalidateQueries({ queryKey: ["catalogs"] });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Províncias e distritos</h1>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-medium">Províncias</h2>
          <div className="flex gap-2">
            <Input placeholder="Nome da província" value={pName} onChange={(e) => setPName(e.target.value)} />
            <Button onClick={async () => { if (!pName) return; try { await upP({ data: { name: pName } }); setPName(""); inv(); toast.success("OK"); } catch (e: any) { toast.error(e.message); } }}>Adicionar</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(data?.provinces ?? []).map((p: any) => (
              <span key={p.id} className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-1 text-sm">
                {p.name}
                <button onClick={() => delP({ data: { id: p.id } }).then(inv)}><Trash2 className="h-3 w-3 text-destructive" /></button>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-medium">Distritos</h2>
          <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <Select value={dProv} onValueChange={setDProv}>
              <SelectTrigger><SelectValue placeholder="Província" /></SelectTrigger>
              <SelectContent>{(data?.provinces ?? []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Nome do distrito" value={dName} onChange={(e) => setDName(e.target.value)} />
            <Button onClick={async () => { if (!dProv || !dName) return; try { await upD({ data: { province_id: dProv, name: dName } }); setDName(""); inv(); toast.success("OK"); } catch (e: any) { toast.error(e.message); } }}>Adicionar</Button>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="p-2">Província</th><th>Distrito</th><th></th></tr></thead>
            <tbody>
              {(data?.districts ?? []).map((d: any) => {
                const p = (data?.provinces ?? []).find((x: any) => x.id === d.province_id);
                return (
                  <tr key={d.id} className="border-t border-border">
                    <td className="p-2 text-muted-foreground">{p?.name}</td>
                    <td>{d.name}</td>
                    <td className="text-right p-2"><Button size="sm" variant="ghost" onClick={() => delD({ data: { id: d.id } }).then(inv)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
