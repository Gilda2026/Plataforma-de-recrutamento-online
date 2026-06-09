import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getContest, contestApplications } from "@/lib/contests.functions.server";

export const Route = createFileRoute("/_authenticated/admin/print/concurso/$id")({ component: PrintContest });

function PrintContest() {
  const { id } = Route.useParams();
  const g = useServerFn(getContest);
  const { data } = useQuery({ queryKey: ["contest", id], queryFn: () => g({ data: { id } }) });
  useEffect(() => { if (data) setTimeout(() => window.print(), 300); }, [data]);
  if (!data) return <p>A carregar…</p>;
  const c = data.contest;
  return (
    <div className="mx-auto max-w-4xl bg-white p-8 text-black print:p-0">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">REPÚBLICA DE MOÇAMBIQUE</h1>
        <p className="text-sm">{c.institutions?.name}</p>
      </header>
      <h2 className="mb-4 text-xl font-bold uppercase">Edital de Concurso Público</h2>
      <p><strong>Designação:</strong> {c.designation}</p>
      <p><strong>Ano:</strong> {c.year}</p>
      <p><strong>Status:</strong> {c.status}</p>

      <h3 className="mt-6 font-bold">Províncias abrangidas</h3>
      <p>{data.provinces.map((p: any) => p.provinces?.name).join(", ")}</p>

      <h3 className="mt-6 font-bold">Vagas disponíveis</h3>
      <table className="mt-2 w-full border-collapse">
        <thead><tr className="border-b border-black"><th className="p-2 text-left">Carreira</th><th className="p-2 text-left">Ocupação</th><th className="p-2 text-right">Vagas</th></tr></thead>
        <tbody>
          {data.positions.map((p: any) => (
            <tr key={p.id} className="border-b">
              <td className="p-2">{p.occupations?.careers?.name}</td>
              <td className="p-2">{p.occupations?.name}</td>
              <td className="p-2 text-right">{p.vacancies}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="mt-12 text-xs">Documento gerado em {new Date().toLocaleString("pt-PT")}</footer>
    </div>
  );
}

export const PrintApproved = () => null;
