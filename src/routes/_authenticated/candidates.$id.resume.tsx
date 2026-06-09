import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCandidateById } from "@/lib/recruitment.functions.server";

export const Route = createFileRoute("/_authenticated/candidates/$id/resume")({
  component: CandidateResumePage,
});

export function CandidateResumePage() {
  const { id } = Route.useParams();

  const getCandidate = useServerFn(getCandidateById);
 

  const { data, isLoading, error } = useQuery({
    queryKey: ["candidate", id],
    enabled: Boolean(id),
    queryFn: () => getCandidate({ data: { id } }),
  });

  if (!id) return <div>ID inválido</div>;
  if (isLoading && !data) return <div>A carregar CV...</div>;
  if (error) return <div>Erro a carregar candidato</div>;

  const c = data?.candidate;
   const ai =
  typeof c?.ai_analysis === "string"
    ? JSON.parse(c.ai_analysis)
    : c?.ai_analysis;

  const profile = Array.isArray(c?.candidate_profiles)
    ? c.candidate_profiles[0]
    : c?.candidate_profiles;

  if (!c) return <div>Candidato não encontrado</div>;

  const education = (c.education as any) ?? [];
  const experience = (c.experience as any) ?? [];
  const internships = (c.internships as any) ?? [];
  const courses = (c.courses as any) ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <h1 className="text-2xl font-bold">
        {profile?.full_name}
      </h1>

      {/* ========================= */}
      {/* RESUMO IA */}
      {/* ========================= */}
      <section>
        <h2 className="font-semibold">Resumo da Avaliação IA</h2>

   {/* <div className="rounded-lg border p-4 whitespace-pre-wrap">
    {ai?.summary ?? "Ainda não existe avaliação para este candidato"}
  </div> */}
  <div
  className={`rounded-lg border p-4 space-y-2 ${
    ai?.score >= 70
      ? "border-blue-500 bg-blue-50 text-blue-900"
      : "border-red-500 bg-red-50 text-red-900"
  }`}
>
  <p className="font-medium">
    {ai?.summary ?? "Ainda não existe avaliação para este candidato"}
  </p>

  {ai?.strengths?.length > 0 && (
    <div>
      <b>Pontos fortes:</b>
      <ul className="list-disc ml-5">
        {ai.strengths.map((s: string, i: number) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  )}

  {ai?.weaknesses?.length > 0 && (
    <div>
      <b>Pontos fracos:</b>
      <ul className="list-disc ml-5">
        {ai.weaknesses.map((s: string, i: number) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  )}
</div>
      </section>

      {/* ========================= */}
      {/* CONTACTO */}
      {/* ========================= */}
      <section>
        <h2 className="font-semibold">Contacto</h2>
        <p>{profile?.phone}</p>
      </section>
{/* ========================= */}
{/* HABILITAÇÃO ACADÉMICA */}
{/* ========================= */}
<section>
  <h2 className="font-semibold">Habilitação académica</h2>

  {education.filter((e: any) => e.kind !== "formacao").length > 0 ? (
    education
      .filter((e: any) => e.kind !== "formacao")
      .map((e: any) => (
        <div key={e.id} className="mb-2">
          <div className="font-medium">{e.course}</div>
          <div className="text-sm text-muted-foreground">
            {e.institution}
          </div>
        </div>
      ))
  ) : (
    <p className="text-sm text-muted-foreground">
      Sem habilitação académica registada
    </p>
  )}
</section>

{/* ========================= */}
{/* FORMAÇÃO ESPECÍFICA (NOVO) */}
{/* ========================= */}
<section>
  <h2 className="font-semibold">Formação específica</h2>

  {education.filter((e: any) => e.kind === "formacao").length > 0 ? (
    education
      .filter((e: any) => e.kind === "formacao")
      .map((e: any) => (
        <div key={e.id} className="mb-2">
          <div className="font-medium">{e.course}</div>
          <div className="text-sm text-muted-foreground">
            {e.institution}
            {e.year ? ` · ${e.year}` : ""}
          </div>
        </div>
      ))
  ) : (
    <p className="text-sm text-muted-foreground">
      Sem formação específica registada
    </p>
  )}
</section>

      {/* ========================= */}
      {/* EXPERIÊNCIA PROFISSIONAL */}
      {/* ========================= */}
      <section>
        <h2 className="font-semibold">Experiência profissional</h2>

        {experience.length > 0 ? (
          experience.map((e: any) => (
            <div key={e.id} className="mb-2">
              <b>{e.role}</b> @ {e.company}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Sem experiência registada
          </p>
        )}
      </section>

      {/* ========================= */}
      {/* ESTÁGIOS PRÉ-PROFISSIONAIS */}
      {/* ========================= */}
      <section>
        <h2 className="font-semibold">Estágios pré-profissionais</h2>

        {internships.length > 0 ? (
          internships.map((i: any) => (
            <div key={i.id} className="mb-2">
              <div>{i.institution}</div>
              {i.area && (
                <div className="text-sm text-muted-foreground">
                  {i.area}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Sem estágios registados
          </p>
        )}
      </section>

      {/* ========================= */}
      {/* CURSOS DE FORMAÇÃO */}
      {/* ========================= */}
      <section>
        <h2 className="font-semibold">Cursos de formação</h2>

        {courses.length > 0 ? (
          courses.map((c: any) => (
            <div key={c.id} className="mb-2">
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-muted-foreground">
                {c.institution}
                {c.year ? ` · ${c.year}` : ""}
                {c.hours ? ` · ${c.hours}h` : ""}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Sem cursos registados
          </p>
        )}
      </section>

    </div>
  );
}