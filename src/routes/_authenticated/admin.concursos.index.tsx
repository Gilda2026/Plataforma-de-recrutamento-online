import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listContests, setContestStatus } from "@/lib/contests.functions.server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/concursos/")({ component: List });

function List() {
  const qc = useQueryClient();
  const fn = useServerFn(listContests);
  const setStatus = useServerFn(setContestStatus);
  const { data } = useQuery({ queryKey: ["contests"], queryFn: () => fn() });

  const publish = async (id: string) => {
    try { await setStatus({ data: { id, status: "publicado" } }); toast.success("Publicado"); qc.invalidateQueries({ queryKey: ["contests"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Concursos</h1>
        <Button asChild><Link to="/admin/concursos/novo"><Plus className="mr-2 h-4 w-4" />Abrir concurso</Link></Button>
      </header>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr><th className="p-3">Designação</th><th>Ano</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {(data?.contests ?? []).map((c: any) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3"><Link to="/admin/concursos/$id" params={{ id: c.id }} className="font-medium hover:text-accent">{c.designation}</Link><div className="text-xs text-muted-foreground">{c.institutions?.name}</div></td>
                <td>{c.year}</td>
                <td><Badge variant={c.status === "publicado" ? "default" : "secondary"}>{c.status}</Badge></td>
                <td className="text-right p-3">
                  {c.status === "rascunho" && <Button size="sm" variant="outline" onClick={() => publish(c.id)}>Publicar</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
