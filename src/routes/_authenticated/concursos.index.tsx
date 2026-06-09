import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listContests } from "@/lib/contests.functions.server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar } from "lucide-react";
import { useRoles } from "@/hooks/use-roles";

export const Route = createFileRoute("/_authenticated/concursos/")({
  head: () => ({ meta: [{ title: "Concursos — Talvio" }] }),
  component: ConcursosPage,
});

function ConcursosPage() {
  const fn = useServerFn(listContests);
  const { data } = useQuery({ queryKey: ["contests"], queryFn: () => fn() });
  const { isStaff } = useRoles();
  const all = data?.contests ?? [];
  const list = isStaff ? all : all.filter((c) => c.status === "publicado");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Concursos públicos</h1>
        <p className="text-sm text-muted-foreground">Concursos abertos para candidatura.</p>
      </header>

      {list.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Sem concursos disponíveis.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {list.map((c: any) => (
            <Link key={c.id} to="/concursos/$id" params={{ id: c.id }}>
              <Card className="transition hover:shadow-md">
                <CardContent className="flex items-start justify-between gap-4 p-5">
                  <div>
                    <h3 className="font-display text-lg font-bold">{c.designation}</h3>
                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{c.institutions?.name ?? "—"}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{c.year}</span>
                    </div>
                  </div>
                  <Badge variant={c.status === "publicado" ? "default" : "secondary"}>{c.status}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
