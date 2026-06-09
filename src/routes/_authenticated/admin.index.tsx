import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listContests } from "@/lib/contests.functions.server";
import { listCatalogs } from "@/lib/catalog.functions";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Briefcase, Building2, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDash,
});

function AdminDash() {
  const c = useServerFn(listContests);
  const cat = useServerFn(listCatalogs);
  const { data: cd } = useQuery({ queryKey: ["contests"], queryFn: () => c() });
  const { data: catalogs } = useQuery({ queryKey: ["catalogs"], queryFn: () => cat() });

  const contests = cd?.contests ?? [];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={FileText} label="Concursos" value={contests.length} to="/admin/concursos" />
        <Stat icon={Briefcase} label="Carreiras" value={catalogs?.careers?.length ?? 0} to="/admin/carreiras" />
        <Stat icon={Building2} label="Instituições" value={catalogs?.institutions?.length ?? 0} to="/admin/instituicoes" />
        <Stat icon={MapPin} label="Províncias" value={catalogs?.provinces?.length ?? 0} to="/admin/localidades" />
      </div>
      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Concursos recentes</h2>
          {contests.length === 0 ? <p className="text-sm text-muted-foreground">Sem concursos.</p> : (
            <ul className="divide-y divide-border">
              {contests.slice(0, 5).map((c: any) => (
                <li key={c.id} className="py-2">
                  <Link to="/admin/concursos/$id" params={{ id: c.id }} className="flex items-center justify-between hover:text-accent">
                    <span>{c.designation} <span className="text-muted-foreground">· {c.year}</span></span>
                    <span className="text-xs uppercase">{c.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, to }: any) {
  return (
    <Link to={to}>
      <Card className="transition hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-center justify-between"><span className="text-xs uppercase text-muted-foreground">{label}</span><Icon className="h-4 w-4 text-accent" /></div>
          <div className="mt-2 font-display text-3xl font-bold">{value}</div>
        </CardContent>
      </Card>
    </Link>
  );
}
