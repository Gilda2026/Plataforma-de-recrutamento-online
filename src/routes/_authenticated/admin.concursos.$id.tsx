import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getContest, contestApplications, setContestStatus, updateApplicationStatus } from "@/lib/contests.functions.server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/concursos/$id")({ component: Detail });

function Detail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const g = useServerFn(getContest);
  const a = useServerFn(contestApplications);
  const s = useServerFn(setContestStatus);
  const u = useServerFn(updateApplicationStatus);
  const { data } = useQuery({ queryKey: ["contest", id], queryFn: () => g({ data: { id } }) });
  const { data: ad } = useQuery({ queryKey: ["contest-apps", id], queryFn: () => a({ data: { contest_id: id } }) });

  if (!data) return <p className="text-muted-foreground">A carregar…</p>;
  const c = data.contest;
  const apps = ad?.applications ?? [];

  const setStatus = async (status: "publicado" | "encerrado") => {
    await s({ data: { id, status } }); qc.invalidateQueries({ queryKey: ["contest", id] }); toast.success("Atualizado");
  };
  const setApp = async (appId: string, status: any) => {
    await u({ data: { id: appId, status } }); qc.invalidateQueries({ queryKey: ["contest-apps", id] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">{c.designation}</h1>
          <p className="text-sm text-muted-foreground">{c.institutions?.name} · {c.year}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{c.status}</Badge>
          {c.status === "rascunho" && <Button size="sm" onClick={() => setStatus("publicado")}>Publicar</Button>}
          {c.status === "publicado" && <Button size="sm" variant="outline" onClick={() => setStatus("encerrado")}>Encerrar</Button>}
          <Button size="sm" variant="outline" asChild><Link to="/admin/print/concurso/$id" params={{ id }} target="_blank"><Printer className="mr-2 h-4 w-4" />Imprimir concurso</Link></Button>
          <Button size="sm" variant="outline" asChild><Link to="/admin/print/aprovados/$id" params={{ id }} target="_blank"><CheckCircle2 className="mr-2 h-4 w-4" />Lista aprovados</Link></Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Vagas</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="py-2">Carreira</th><th>Ocupação</th><th className="text-right">Vagas</th></tr></thead>
            <tbody>
              {data.positions.map((p: any) => (
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

      <Card>
        <CardHeader><CardTitle>Candidaturas ({apps.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {apps.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Sem candidaturas.</p> : (
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground"><tr><th className="p-3">Candidato</th><th>Ocupação</th><th>Score</th>
              {/* <th>Status</th> */}
              </tr></thead>
              <tbody>
                {apps.map((ap: any) => (
                  <tr key={ap.id} className="border-t border-border">
                    <td className="p-3">{ap.candidate_profiles?.full_name ?? "—"}<div className="text-xs text-muted-foreground">{ap.candidate_profiles?.doc_number}</div></td>
                    <td>{ap.contest_positions?.occupations?.name}</td>
                    <td className="font-medium">{ap.final_score != null ? Math.round(Number(ap.final_score)) : "—"}</td>
                    {/* <td>
                      <Select value={ap.status} onValueChange={(v) => setApp(ap.id, v)}>
                        <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="submetida">Submetida</SelectItem>
                          <SelectItem value="em_analise">Em análise</SelectItem>
                          <SelectItem value="entrevista">Entrevista</SelectItem>
                          <SelectItem value="aprovado">Aprovado</SelectItem>
                          <SelectItem value="rejeitado">Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
