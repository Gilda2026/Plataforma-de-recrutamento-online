import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { myApplications } from "@/lib/contests.functions.server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/minhas-candidaturas")({
  head: () => ({ meta: [{ title: "Minhas candidaturas — Talvio" }] }),
  component: MyAppsPage,
});

const statusLabel: Record<string, string> = {
  submetida: "Submetida", em_analise: "Em análise", entrevista: "Entrevista", aprovado: "Aprovado", rejeitado: "Rejeitado",
};

function MyAppsPage() {
  const fn = useServerFn(myApplications);
  const { data } = useQuery({ queryKey: ["my-applications"], queryFn: () => fn() });
  const apps = data?.applications ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Minhas candidaturas</h1>
      </header>
      {apps.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Ainda não se candidatou a nenhum concurso.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {apps.map((a: any) => (
            <Card key={a.id}>
              <CardContent className="flex items-start justify-between p-5">
                <div>
                 <p className="text-sm text-muted-foreground">
    {a.contests?.designation}
    {" · "}
    {a.contests?.institutions?.name}
    {" · "}
    {a.contest_positions?.occupations?.careers?.name}
    {" → "}
    {a.contest_positions?.occupations?.name}
  </p>
                </div>
                <div className="text-right space-y-1">
                  <Badge>{statusLabel[a.status] ?? a.status}</Badge>
                  {a.final_score != null && <div className="font-display text-2xl font-bold">{Math.round(Number(a.final_score))}</div>}
                </div>
                  {/* 🔥 NOVO: data de atualização */}
  <p className="text-xs text-muted-foreground mt-1">
    Atualizado em{" "}
    {a.updated_at
      ? new Date(a.updated_at).toLocaleDateString("pt-PT", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "-"}
  </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
