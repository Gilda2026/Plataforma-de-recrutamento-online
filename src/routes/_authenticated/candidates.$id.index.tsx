import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import {
  getCandidate,
  generateInterview,
  submitInterview,
  generateTest,
  submitTest,
  updateCandidateStatus,
} from "@/lib/recruitment.functions.server";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { StatusBadge } from "./dashboard";

import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Mail,
  Briefcase,
  Phone,
  User,
  FileText,
} from "lucide-react";

export const Route = createFileRoute(
  "/_authenticated/candidates/$id/"
)({
  head: () => ({
    meta: [
      {
        title: "Candidato — Talvio",
      },
    ],
  }),

  component: Detail,
});

type Question = {
  id: string;
  question: string;
  focus?: string;
};

type MCQ = {
  id: string;
  question: string;
  options: string[];
  correct: number;
};

function Detail() {
  const { id } =
    Route.useParams();

  const fn =
    useServerFn(
      getCandidate
    );

  const qc =
    useQueryClient();

  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: [
      "candidate",
      id,
    ],

    queryFn: () =>
      fn({
        data: { id },
      }),
  });

  if (
    isLoading ||
    !data
  ) {
    return (
      <div className="text-muted-foreground">
        A carregar…
      </div>
    );
  }

  const {
    candidate,
    interviews,
    tests,
  } = data;

  const analysis =
    (candidate.cv_analysis ??
      {}) as {
      summary?: string;
      years_experience?: number;
      skills?: string[];
      strengths?: string[];
      weaknesses?: string[];
      education?: string;
      fit_score?: number;
      recommendation?: string;
    };

  return (
    <div className="space-y-6">

      <Link
        to="/candidates"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Candidatos
      </Link>

      {/* HEADER */}

      <header
        className="overflow-hidden rounded-2xl border border-border bg-card"
        style={{
          boxShadow:
            "var(--shadow-card)",
        }}
      >

        <div className="border-b border-border bg-gradient-to-r from-accent/10 via-background to-background p-6">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

            <div className="space-y-5">

              <div>

                <div className="mb-2 flex items-center gap-3">

                  <h1 className="font-display text-4xl font-bold tracking-tight">
                    {candidate.name}
                  </h1>

                  <StatusBadge
                    status={
                      candidate.status
                    }
                  />

                </div>

                <p className="text-muted-foreground">
                  {candidate.role_target ||
                    "Cargo não especificado"}
                </p>

              </div>

              <div className="grid gap-3 md:grid-cols-2">

                <InfoCard
                  icon={Phone}
                  label="Telefone"
                  value={
                    candidate.phone ||
                    "—"
                  }
                />

                <InfoCard
                  icon={Mail}
                  label="Email"
                  value={
                    candidate.email ||
                    "—"
                  }
                />

                <InfoCard
                  icon={User}
                  label="Documento"
                  value={
                    candidate.document_number ||
                    "—"
                  }
                />

                <InfoCard
                  icon={Briefcase}
                  label="Cargo"
                  value={
                    candidate.role_target ||
                    "—"
                  }
                />

              </div>

            </div>

            <div className="flex flex-col items-end gap-4">

              <div className="rounded-2xl border border-accent/20 bg-accent/5 px-8 py-5 text-center">

                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Fit Score
                </div>

                <div className="font-display text-5xl font-black text-accent">
                  {Math.round(
                    Number(
                      candidate.score
                    ) || 0
                  )}
                </div>

              </div>

              <StatusSelector
                id={candidate.id}
                status={
                  candidate.status
                }
                onChange={() =>
                  qc.invalidateQueries(
                    {
                      queryKey: [
                        "candidate",
                        id,
                      ],
                    }
                  )
                }
              />

            </div>

          </div>

        </div>

        {analysis.summary && (

          <div className="p-6">

            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">

              <div className="mb-3 flex items-center gap-2 font-semibold text-accent">

                <Sparkles className="h-4 w-4" />

                Resumo Inteligente IA

              </div>

              <p className="leading-relaxed text-muted-foreground">
                {analysis.summary}
              </p>

            </div>

          </div>

        )}

      </header>

      <Tabs defaultValue="analysis">

        <TabsList>

          <TabsTrigger value="analysis">
            Análise IA
          </TabsTrigger>

          <TabsTrigger value="interview">
            Entrevista
          </TabsTrigger>

          <TabsTrigger value="test">
            Teste técnico
          </TabsTrigger>

        </TabsList>

        {/* ANALYSIS */}

        <TabsContent
          value="analysis"
          className="space-y-6 pt-4"
        >

          <div className="grid gap-4 md:grid-cols-3">

            <Card title="Competências principais">
              <Chips
                items={
                  analysis.skills
                }
              />
            </Card>

            <Card title="Pontos fortes">
              <Chips
                items={
                  analysis.strengths
                }
                tone="success"
              />
            </Card>

            <Card title="Pontos a melhorar">
              <Chips
                items={
                  analysis.weaknesses
                }
                tone="warn"
              />
            </Card>

          </div>

          <Card title="Resumo profissional">

            <div className="grid gap-6 md:grid-cols-2">

              <Info
                label="Experiência"
                value={`${analysis.years_experience ?? 0} anos`}
              />

              <Info
                label="Formação"
                value={
                  analysis.education ??
                  "—"
                }
              />

              <Info
                label="Recomendação IA"
                value={
                  analysis.recommendation ??
                  "—"
                }
              />

              <Info
                label="Score"
                value={`${Math.round(Number(candidate.score) || 0)}/100`}
              />

            </div>

          </Card>

          {candidate.experience && (

            <Card title="Experiência profissional">

              <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {
                  candidate.experience
                }
              </div>

            </Card>

          )}

          {candidate.education && (

            <Card title="Formação académica">

              <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {
                  candidate.education
                }
              </div>

            </Card>

          )}

          {candidate.cv_url && (

            <Card title="Curriculum Vitae">

              <div className="flex items-center justify-between rounded-xl border border-border p-4">

                <div className="flex items-center gap-3">

                  <div className="rounded-lg bg-secondary p-2">
                    <FileText className="h-5 w-5" />
                  </div>

                  <div>

                    <div className="font-medium">
                      CV do candidato
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Documento anexado
                    </div>

                  </div>

                </div>

                <Button
                  asChild
                  variant="outline"
                >

                  <a
                    href={
                      candidate.cv_url
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver CV
                  </a>

                </Button>

              </div>

            </Card>

          )}

        </TabsContent>

        <TabsContent
          value="interview"
          className="pt-4"
        >

          <InterviewPanel
            candidateId={
              candidate.id
            }
            interviews={
              interviews
            }
            onUpdate={() =>
              qc.invalidateQueries(
                {
                  queryKey: [
                    "candidate",
                    id,
                  ],
                }
              )
            }
          />

        </TabsContent>

        <TabsContent
          value="test"
          className="pt-4"
        >

          <TestPanel
            candidateId={
              candidate.id
            }
            tests={tests}
            onUpdate={() =>
              qc.invalidateQueries(
                {
                  queryKey: [
                    "candidate",
                    id,
                  ],
                }
              )
            }
          />

        </TabsContent>

      </Tabs>

    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {

  return (
    <div
      className="rounded-xl border border-border bg-card p-5"
      style={{
        boxShadow:
          "var(--shadow-card)",
      }}
    >

      <h3 className="mb-3 font-display font-bold">
        {title}
      </h3>

      {children}

    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div>

      <div className="text-xs uppercase text-muted-foreground">
        {label}
      </div>

      <div className="font-medium">
        {value}
      </div>

    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: any) {

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-4">

      <div className="rounded-xl bg-secondary p-2">
        <Icon className="h-4 w-4" />
      </div>

      <div>

        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </div>

        <div className="font-medium">
          {value || "—"}
        </div>

      </div>

    </div>
  );
}

function Chips({
  items,
  tone,
}: {
  items?: string[];
  tone?: "success" | "warn";
}) {

  if (!items?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        —
      </p>
    );
  }

  const cls =
    tone === "success"
      ? "bg-success/10 text-success border-success/30"
      : tone === "warn"
      ? "bg-warning/15 text-warning-foreground border-warning/30"
      : "bg-secondary text-secondary-foreground border-border";

  return (
    <div className="flex flex-wrap gap-1.5">

      {items.map(
        (x, i) => (
          <span
            key={i}
            className={`rounded-md border px-2 py-1 text-xs ${cls}`}
          >
            {x}
          </span>
        )
      )}

    </div>
  );
}

function StatusSelector({
  id,
  status,
  onChange,
}: {
  id: string;
  status: string;
  onChange: () => void;
}) {

  const fn =
    useServerFn(
      updateCandidateStatus
    );

  return (
    <Select
      defaultValue={status}
      onValueChange={async (
        v
      ) => {

        try {

          await fn({
            data: {
              id,
              status:
                v as any,
            },
          });

          toast.success(
            "Estado atualizado"
          );

          onChange();

        } catch (e) {

          toast.error(
            e instanceof Error
              ? e.message
              : "Erro"
          );
        }
      }}
    >

      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>

        {[
          "new",
          "review",
          "shortlist",
          "interview",
          "rejected",
          "hired",
        ].map((s) => (

          <SelectItem
            key={s}
            value={s}
          >
            {s}
          </SelectItem>

        ))}

      </SelectContent>

    </Select>
  );
}

/* MANTENHA AQUI O SEU InterviewPanel E TestPanel ORIGINAIS */


function InterviewPanel({ candidateId, interviews, onUpdate }: { candidateId: string; interviews: any[]; onUpdate: () => void }) {
  const gen = useServerFn(generateInterview);
  const sub = useServerFn(submitInterview);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const current = interviews.find((i) => i.status === "pending") ?? interviews[0];

  async function generate() {
    setLoading(true);
    try { await gen({ data: { candidate_id: candidateId } }); onUpdate(); toast.success("Entrevista gerada"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setLoading(false); }
  }

  async function submit() {
    if (!current) return;
    setLoading(true);
    try {
      const payload = (current.questions as Question[]).map((q) => ({ id: q.id, answer: answers[q.id] || "" }));
      await sub({ data: { interview_id: current.id, answers: payload } });
      onUpdate(); toast.success("Entrevista avaliada");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setLoading(false); }
  }

  if (!current) {
    return (
      <Card title="Entrevista automática">
        <p className="text-sm text-muted-foreground">Ainda não existe entrevista. Gere perguntas adaptadas ao CV e ao cargo.</p>
        <Button className="mt-4" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Gerar entrevista
        </Button>
      </Card>
    );
  }

  const isCompleted = current.status === "completed";
  const questions = current.questions as Question[];

  return (
    <div className="space-y-4">
      <Card title={isCompleted ? `Entrevista — Score ${Math.round(Number(current.score) || 0)}/100` : "Entrevista pendente"}>
        {isCompleted && (
          <p className="mb-4 text-sm leading-relaxed">{current.evaluation?.summary}</p>
        )}
        <div className="space-y-5">
          {questions.map((q, idx) => {
            const eval_ = current.evaluation?.per_question?.find((x: any) => x.id === q.id);
            return (
              <div key={q.id} className="space-y-2">
                <Label className="text-base"><span className="text-accent">{idx + 1}.</span> {q.question}</Label>
                {q.focus && <p className="text-xs text-muted-foreground">Foco: {q.focus}</p>}
                {isCompleted ? (
                  <div className="space-y-2">
                    <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm">{current.answers?.find((a: any) => a.id === q.id)?.answer || "—"}</div>
                    {eval_ && (
                      <div className="rounded-md border border-accent/30 bg-accent/5 p-3 text-sm">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs uppercase text-muted-foreground">Avaliação IA</span>
                          <span className="font-display font-bold text-accent">{eval_.score}/100</span>
                        </div>
                        {eval_.feedback}
                      </div>
                    )}
                  </div>
                ) : (
                  <Textarea rows={3} value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
                )}
              </div>
            );
          })}
        </div>
        {!isCompleted && (
          <Button className="mt-4" onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Submeter para avaliação IA
          </Button>
        )}
      </Card>
    </div>
  );
}

function TestPanel({ candidateId, tests, onUpdate }: { candidateId: string; tests: any[]; onUpdate: () => void }) {
  const gen = useServerFn(generateTest);
  const sub = useServerFn(submitTest);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const current = tests.find((t) => t.status === "pending") ?? tests[0];

  async function generate() {
    if (!topic) return toast.error("Indique um tópico");
    setLoading(true);
    try { await gen({ data: { candidate_id: candidateId, topic } }); setTopic(""); onUpdate(); toast.success("Teste gerado"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setLoading(false); }
  }

  async function submit() {
    if (!current) return;
    setLoading(true);
    try {
      const payload = (current.questions as MCQ[]).map((q) => ({ id: q.id, selected: answers[q.id] ?? -1 }));
      const r = await sub({ data: { test_id: current.id, answers: payload } });
      onUpdate(); toast.success(`Teste avaliado: ${r.correct}/${r.total}`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <Card title="Novo teste técnico">
        <div className="flex gap-2">
          <Input placeholder="Tópico (ex.: React Hooks, SQL avançado)" value={topic} onChange={(e) => setTopic(e.target.value)} />
          <Button onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar</>}
          </Button>
        </div>
      </Card>

      {current && (
        <Card title={current.status === "completed" ? `Teste: ${current.topic} — ${Math.round(Number(current.score) || 0)}/100` : `Teste: ${current.topic}`}>
          <div className="space-y-5">
            {(current.questions as MCQ[]).map((q, idx) => {
              const sel = current.status === "completed"
                ? current.answers?.find((a: any) => a.id === q.id)?.selected
                : answers[q.id];
              return (
                <div key={q.id}>
                  <div className="mb-2 font-medium"><span className="text-accent">{idx + 1}.</span> {q.question}</div>
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => {
                      const isSelected = sel === oi;
                      const isCorrect = q.correct === oi;
                      const showResult = current.status === "completed";
                      const cls = showResult
                        ? isCorrect
                          ? "border-success/50 bg-success/10"
                          : isSelected
                          ? "border-destructive/50 bg-destructive/10"
                          : "border-border"
                        : isSelected
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/40";
                      return (
                        <button
                          key={oi}
                          disabled={showResult}
                          onClick={() => setAnswers({ ...answers, [q.id]: oi })}
                          className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${cls}`}
                        >
                          {String.fromCharCode(65 + oi)}. {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {current.status !== "completed" && (
            <Button className="mt-4" onClick={submit} disabled={loading}>Submeter respostas</Button>
          )}
        </Card>
      )}
    </div>
  );
}
