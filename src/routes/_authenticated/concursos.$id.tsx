import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getContest, apply } from "@/lib/contests.functions.server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/concursos/$id")({
  component: ContestDetail,
});

function ContestDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const fn = useServerFn(getContest);
  const applyFn = useServerFn(apply);
  const { data } = useQuery({ queryKey: ["contest", id], queryFn: () => fn({ data: { id } }) });

  const positions = data?.positions ?? [];
  // agrupar por carreira
  const byCareer = new Map<string, { name: string; items: any[] }>();
  positions.forEach((p: any) => {
    const cName = p.occupations?.careers?.name ?? "Sem carreira";
    const cId = p.occupations?.career_id ?? "_";
    if (!byCareer.has(cId)) byCareer.set(cId, { name: cName, items: [] });
    byCareer.get(cId)!.items.push(p);
  });
  const careers = Array.from(byCareer.entries());

  const [careerKey, setCareerKey] = useState("");
  const [posId, setPosId] = useState("");
  const items = careerKey ? byCareer.get(careerKey)?.items ?? [] : [];

  const candidatar = async () => {
    try {
      await applyFn({ data: { contest_id: id, contest_position_id: posId } });
      toast.success("Candidatura submetida");
      qc.invalidateQueries({ queryKey: ["my-applications"] });
    } catch (e: any) { toast.error(e.message); }
  };

  if (!data) return <p className="text-muted-foreground">A carregar…</p>;
  const c = data.contest;

  return (
    <div className="space-y-6">
      <div><Link to="/concursos" className="text-sm text-accent hover:underline">← Concursos</Link></div>
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{c.designation}</h1>
          <p className="text-sm text-muted-foreground">{c.institutions?.name} · {c.year}</p>
        </div>
        <Badge>{c.status}</Badge>
      </header>

      <Card>
        <CardHeader><CardTitle>Províncias</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {data.provinces.map((p: any) => <Badge key={p.province_id} variant="outline">{p.provinces?.name}</Badge>)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Vagas</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="py-2">Carreira</th><th>Ocupação</th><th className="text-right">Vagas</th></tr></thead>
            <tbody>
              {positions.map((p: any) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="py-2">{p.occupations?.careers?.name}</td>
                  <td>{p.occupations?.name}</td>
                  <td className="text-right tabular-nums">{p.vacancies}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {c.status === "publicado" && (
        <Card>
          <CardHeader><CardTitle>Candidatar-me</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Select value={careerKey} onValueChange={(v) => { setCareerKey(v); setPosId(""); }}>
              <SelectTrigger><SelectValue placeholder="1. Escolher carreira" /></SelectTrigger>
              <SelectContent>{careers.map(([k, v]) => <SelectItem key={k} value={k}>{v.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={posId} onValueChange={setPosId} disabled={!careerKey}>
              <SelectTrigger><SelectValue placeholder="2. Escolher ocupação" /></SelectTrigger>
              <SelectContent>{items.map((p) => <SelectItem key={p.id} value={p.id}>{p.occupations?.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button disabled={!posId} onClick={candidatar}>Submeter candidatura</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
