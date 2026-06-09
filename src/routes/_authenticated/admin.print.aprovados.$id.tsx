import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getContest, contestApplications } from "@/lib/contests.functions.server";

export const Route = createFileRoute("/_authenticated/admin/print/aprovados/$id")({ component: PrintApproved });

function PrintApproved() {
  const { id } = Route.useParams();
  const g = useServerFn(getContest);
  const a = useServerFn(contestApplications);
  const { data: cd } = useQuery({ queryKey: ["contest", id], queryFn: () => g({ data: { id } }) });
  const { data: ad } = useQuery({ queryKey: ["contest-apps", id], queryFn: () => a({ data: { contest_id: id } }) });
  useEffect(() => { if (cd && ad) setTimeout(() => window.print(), 300); }, [cd, ad]);
  if (!cd || !ad) return <p>A carregar…</p>;
  const c = cd.contest;
  const approved = (ad.applications ?? []).filter((x: any) => x.status === "aprovado");

  return (
    <div className="mx-auto max-w-4xl bg-white p-8 text-black print:p-0">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">{c.institutions?.name}</h1>
        <p className="text-sm">{c.designation} — {c.year}</p>
      </header>
      <h2 className="mb-4 text-xl font-bold uppercase">Lista de Candidatos Aprovados</h2>
      {approved.length === 0 ? <p>Não existem candidatos aprovados.</p> : (
        <table className="w-full border-collapse">
          <thead><tr className="border-b border-black">
            <th className="p-2 text-left">#</th><th className="p-2 text-left">Nome</th><th className="p-2 text-left">Documento</th><th className="p-2 text-left">Ocupação</th><th className="p-2 text-right">Score</th>
          </tr></thead>
          <tbody>
            {approved.map((ap: any, idx: number) => (
              <tr key={ap.id} className="border-b">
                <td className="p-2">{idx + 1}</td>
                <td className="p-2">{ap.candidate_profiles?.full_name ?? "—"}</td>
                <td className="p-2">{ap.candidate_profiles?.doc_number ?? "—"}</td>
                <td className="p-2">{ap.contest_positions?.occupations?.name}</td>
                <td className="p-2 text-right">{ap.final_score != null ? Math.round(Number(ap.final_score)) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <footer className="mt-12 text-xs">Gerado em {new Date().toLocaleString("pt-PT")}</footer>
    </div>
  );
}
