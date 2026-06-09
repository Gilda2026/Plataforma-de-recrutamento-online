import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callAI } from "./ai-gateway";
import { z } from "zod";


// ===== Listagem =====
export const listCandidates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("candidates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { candidates: data ?? [] };
  });

export const getCandidate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [c, i, t] = await Promise.all([
      (context.supabase as any).from("candidates").select("*").eq("id", data.id).single(),
      (context.supabase as any).from("interview_sessions").select("*").eq("candidate_id", data.id).order("created_at", { ascending: false }),
      (context.supabase as any).from("test_assignments").select("*").eq("candidate_id", data.id).order("created_at", { ascending: false }),
    ]);
    if (c.error) throw new Error(c.error.message);
    return { candidate: c.data, interviews: i.data ?? [], tests: t.data ?? [] };
  });


  export const getCandidateById = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {

    // 1. Application base (ANTES: candidates)
    const appRes = await context.supabase
      .from("applications")
      .select(`
        *,
        contest_positions (
          occupations (
            id,
            name,
            career_id,
            careers (
              id,
              name
            )
          )
        )
      `)
      .eq("id", data.id)
      .single();

    if (appRes.error) {
      throw new Error(appRes.error.message);
    }

    const app = appRes.data;

    if (!app) {
      return { candidate: null };
    }

    // 2. Profile normalizado
    const { data: profile, error: profileError } =
  await context.supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", app.user_id)
    .maybeSingle();

if (profileError) {
  throw new Error(profileError.message);
}

    const userId = profile?.user_id;

if (!userId) {
  return {
    candidate: {
      ...app,
      candidate_profiles: profile ?? null,
      experience: [],
      education: [],
      courses: [],
      internships: [],
    },
  };
}

    // 3. Related data
    const [
      experienceRes,
      educationRes,
      coursesRes,
      internshipsRes,
    ] = await Promise.all([
      context.supabase
        .from("candidate_experience")
        .select("*")
        .eq("user_id", userId),

      context.supabase
        .from("candidate_education")
        .select("*")
        .eq("user_id", userId),

      context.supabase
        .from("candidate_courses")
        .select("*")
        .eq("user_id", userId),

      context.supabase
        .from("candidate_internships")
        .select("*")
        .eq("user_id", userId),
    ]);

    // 4. Return unificado
    return {
      candidate: {
        ...app,

        candidate_profiles: profile ?? null,

        experience: experienceRes.data ?? [],
        education: educationRes.data ?? [],
        courses: coursesRes.data ?? [],
        internships: internshipsRes.data ?? [],
      },
    };
  });



// ===== Análise de CV =====
const cvAnalysisSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    years_experience: { type: "number" },
    skills: { type: "array", items: { type: "string" } },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
    education: { type: "string" },
    fit_score: { type: "number", description: "0-100 fit para o cargo" },
    recommendation: { type: "string", enum: ["forte", "considerar", "rejeitar"] },
  },
  required: ["summary", "years_experience", "skills", "strengths", "weaknesses", "education", "fit_score", "recommendation"],
  additionalProperties: false,
};

export const analyzeCv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      name: z.string().min(1).max(200),
      email: z.string().email().optional().or(z.literal("")),
      role_target: z.string().min(1).max(200),
      cv_text: z.string().min(50).max(50000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const analysis = await callAI<{
      summary: string;
      years_experience: number;
      skills: string[];
      strengths: string[];
      weaknesses: string[];
      education: string;
      fit_score: number;
      recommendation: string;
    }>({
      messages: [
        { role: "system", content: "És um recrutador sénior. Analisa CVs em português de Portugal. Sê objetivo e crítico." },
        {
          role: "user",
          content: `Cargo alvo: ${data.role_target}\n\nCV:\n${data.cv_text}\n\nAvalia o fit do candidato para o cargo. Devolve JSON estruturado.`,
        },
      ],
      jsonSchema: { name: "cv_analysis", schema: cvAnalysisSchema },
    });

    const { data: row, error } = await context.supabase
      .from("candidates")
      .insert({
        owner_id: context.userId,
        name: data.name,
        email: data.email || null,
        role_target: data.role_target,
        cv_text: data.cv_text,
        cv_analysis: analysis,
        score: analysis.fit_score,
        status: analysis.recommendation === "forte" ? "shortlist" : analysis.recommendation === "rejeitar" ? "rejected" : "review",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { candidate: row };
  });

// ===== Entrevista automática =====
const questionsSchema = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          question: { type: "string" },
          focus: { type: "string" },
        },
        required: ["id", "question", "focus"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
};

export const generateInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ candidate_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const cand = await context.supabase.from("candidates").select("*").eq("id", data.candidate_id).single();
    if (cand.error) throw new Error(cand.error.message);
    const c = cand.data;

    const result = await callAI<{ questions: { id: string; question: string; focus: string }[] }>({
      messages: [
        { role: "system", content: "És um entrevistador técnico. Gera perguntas em português de Portugal." },
        {
          role: "user",
          content: `Cargo: ${c.role_target}\nResumo do candidato: ${JSON.stringify(c.cv_analysis ?? {})}\n\nGera 5 perguntas de entrevista: 2 comportamentais e 3 técnicas, adaptadas ao cargo e ao perfil. IDs q1..q5.`,
        },
      ],
      jsonSchema: { name: "questions", schema: questionsSchema },
    });

    const { data: row, error } = await context.supabase
      .from("interview_sessions")
      .insert({
        candidate_id: data.candidate_id,
        owner_id: context.userId,
        questions: result.questions,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { interview: row };
  });

const evalSchema = {
  type: "object",
  properties: {
    overall_score: { type: "number", description: "0-100" },
    summary: { type: "string" },
    per_question: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          score: { type: "number" },
          feedback: { type: "string" },
        },
        required: ["id", "score", "feedback"],
        additionalProperties: false,
      },
    },
  },
  required: ["overall_score", "summary", "per_question"],
  additionalProperties: false,
};

export const submitInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      interview_id: z.string().uuid(),
      answers: z.array(z.object({ id: z.string(), answer: z.string().max(5000) })),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const iv = await context.supabase.from("interview_sessions").select("*, candidates(*)").eq("id", data.interview_id).single();
    if (iv.error) throw new Error(iv.error.message);

    const evaluation = await callAI<{
      overall_score: number;
      summary: string;
      per_question: { id: string; score: number; feedback: string }[];
    }>({
      messages: [
        { role: "system", content: "Avalias respostas de entrevista de forma criteriosa em português de Portugal." },
        {
          role: "user",
          content: `Cargo: ${iv.data.candidates.role_target}\nPerguntas: ${JSON.stringify(iv.data.questions)}\nRespostas: ${JSON.stringify(data.answers)}\n\nAtribui score 0-100 a cada resposta e calcula score global ponderado.`,
        },
      ],
      jsonSchema: { name: "evaluation", schema: evalSchema },
    });

    const { error } = await context.supabase
      .from("interview_sessions")
      .update({
        answers: data.answers,
        evaluation,
        score: evaluation.overall_score,
        status: "completed",
      })
      .eq("id", data.interview_id);
    if (error) throw new Error(error.message);
    return { evaluation };
  });

// ===== Testes online =====
const testSchema = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          question: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correct: { type: "number", description: "índice 0-3 da opção correta" },
        },
        required: ["id", "question", "options", "correct"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
};

export const generateTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      candidate_id: z.string().uuid(),
      topic: z.string().min(1).max(200),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const result = await callAI<{
      questions: { id: string; question: string; options: string[]; correct: number }[];
    }>({
      messages: [
        { role: "system", content: "Crias testes técnicos de múltipla escolha em português de Portugal." },
        {
          role: "user",
          content: `Tópico: ${data.topic}. Gera 5 perguntas de múltipla escolha (4 opções cada), com IDs q1..q5 e o índice da opção correta.`,
        },
      ],
      jsonSchema: { name: "test", schema: testSchema },
    });

   const { data: row, error } =
  await (context.supabase as any)
    .from("test_assignments")
    .insert({
      candidate_id: data.candidate_id,
      owner_id: context.userId,
      topic: data.topic,
      questions: result.questions,
    })
    .select()
    .single();
    if (error) throw new Error(error.message);
    return { test: row };
  });

export const submitTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      test_id: z.string().uuid(),
      answers: z.array(z.object({ id: z.string(), selected: z.number().int().min(0).max(10) })),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const t = await context.supabase.from("test_assignments").select("*").eq("id", data.test_id).single();
    if (t.error) throw new Error(t.error.message);

    const qs = (t.data.questions as { id: string; correct: number }[]) ?? [];
    let correct = 0;
    for (const q of qs) {
      const a = data.answers.find((x) => x.id === q.id);
      if (a && a.selected === q.correct) correct++;
    }
    const score = qs.length > 0 ? Math.round((correct / qs.length) * 100) : 0;

    const { error } = await context.supabase
      .from("test_assignments")
      .update({ answers: data.answers, score, status: "completed" })
      .eq("id", data.test_id);
    if (error) throw new Error(error.message);
    return { score, correct, total: qs.length };
  });

// ===== Reclassificação =====
export const updateCandidateStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "review", "shortlist", "interview", "rejected", "hired"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("candidates")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const listProfiles = createServerFn({
  method: "GET",
})
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {

    const { data, error } = await context.supabase
      .from("candidate_profiles")
      .select("*")
      .order("full_name");

    if (error) {
      throw new Error(error.message);
    }

    console.log("profiles:", data);

    return {
      profiles: data ?? [],
    };
  });

export const listRecruitmentCandidates = createServerFn({
  method: "POST",
})
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      contestId: z.string().optional(),
      careerId: z.string().optional(),
      occupationId: z.string().optional(),
      search: z.string().optional(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {

    let query = context.supabase
.from("applications")
.select(`
  id,
  contest_id,
  status,
  final_score,
  ai_analysis,
  user_id,

  candidate_profiles (
    id,
    user_id,
    full_name,
    phone,
    doc_number
  ),

  contest_positions (
    id,
    occupation_id,
    occupations (
      id,
      name,
      career_id,
      careers (
        id,
        name
      )
    )
  )
`)
    // =====================================
    // FILTERS
    // =====================================

    if (data.contestId) {
      query = query.eq(
        "contest_id",
        data.contestId
      );
    }

    const {
      data: applications,
      error,
    } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // =====================================
    // NORMALIZE
    // =====================================

const normalized = (applications ?? []).map((app: any) => {
  const profile = Array.isArray(app.candidate_profiles)
    ? app.candidate_profiles[0]
    : app.candidate_profiles;

  const occupation = app.contest_positions?.occupations;
  const career = occupation?.careers;

  return {
    application_id: app.id,
    contest_id: app.contest_id,
    status: app.status,
    score: Number(app.final_score ?? 0),

    full_name: profile?.full_name ?? "-",
    phone: profile?.phone ?? "-",
    doc_number: profile?.doc_number ?? "-",

    profile_id: profile?.id ?? null,

    career_id: career?.id ?? null,
    career_name: career?.name ?? "-",

    occupation_id: app.contest_positions?.occupation_id ?? null,
    occupation_name: occupation?.name ?? "-",
  };
});
    let candidates = normalized;

    // =====================================
    // CAREER FILTER
    // =====================================

    if (data.careerId) {
      candidates = candidates.filter(
        (candidate: any) =>
          String(candidate.career_id) ===
          String(data.careerId)
      );
    }

    // =====================================
    // OCCUPATION FILTER
    // =====================================

    if (data.occupationId) {
      candidates = candidates.filter(
        (candidate: any) =>
          String(
            candidate.occupation_id
          ) ===
          String(data.occupationId)
      );
    }

    // =====================================
    // SEARCH FILTER
    // =====================================

    if (data.search) {

      const q =
        data.search.toLowerCase();

      candidates = candidates.filter(
        (candidate: any) => {
          return (
            candidate.full_name
              ?.toLowerCase()
              .includes(q) ||

            candidate.phone
              ?.toLowerCase()
              .includes(q) ||

            candidate.doc_number
              ?.toLowerCase()
              .includes(q)
          );
        }
      );
    }

    return {
      candidates,
    };
  });

 

export const analyzeCandidateProfile = createServerFn({
  method: "POST",
})
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      applicationId: z.string().uuid(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {

    try {
      // =====================================
      // APPLICATION
      // =====================================
     const { data: app, error } =
  await context.supabase
    .from("applications")
    .select(`
      *,
      candidate_profiles (*),
      contests (education_level),
      contest_positions (
        occupation_id,
        occupations (
          id,
          name,
          career_id,
          careers (id, name)
        )
      )
    `)
    .eq("id", data.applicationId)
    .single();

      if (error || !app) {
        throw new Error("Application não encontrada");
      }

      const profile: any = app.candidate_profiles;

      if (!profile?.user_id) {
        throw new Error("Candidate profile inválido");
      }

      // =====================================
      // RELATED DATA
      // =====================================
      const [
        educationResult,
        experienceResult,
        coursesResult,
        internshipsResult,
      ] = await Promise.all([
        context.supabase.from("candidate_education").select("*").eq("user_id", profile.user_id),
        context.supabase.from("candidate_experience").select("*").eq("user_id", profile.user_id),
        context.supabase.from("candidate_courses").select("*").eq("user_id", profile.user_id),
        context.supabase.from("candidate_internships").select("*").eq("user_id", profile.user_id),
      ]);

     

const educationLevels: Record<string, number> = {
  "basico": 1,
  "medio": 2,
  "tecnico": 3,
  "licenciatura": 4,
  "pos-graduacao": 5,
  "mestrado": 6,
  "doutoramento": 7,
};

console.log(
  "Candidate education:",
  profile?.education_level
);

console.log(
  "Contest education:",
  app.contests?.education_level
);

const candidateEducation =
  educationLevels[
    profile?.education_level?.trim() ?? ""
  ] ?? 0;

const requiredEducation =
  educationLevels[
    app.contests?.education_level?.trim() ?? ""
  ] ?? 0;

console.log("Candidate education level:", candidateEducation);
console.log("Required education level:", requiredEducation);

const hasValidRequirement =
  !!app.contests?.education_level &&
  requiredEducation > 0;

const educationMatch =
  hasValidRequirement
    ? candidateEducation >= requiredEducation
    : false;

console.log("Education match:", educationMatch);



      // =====================================
      // SCORE (DETERMINISTIC)
      // =====================================
      let score = 0;

      console.log({
  userId: profile.user_id,

  education:
    educationResult.data?.length,

  experience:
    experienceResult.data?.length,

  courses:
    coursesResult.data?.length,

  internships:
    internshipsResult.data?.length,
});

// educação (decisiva)
if (educationMatch) {
  score += 60;
} else {
  score += 0;
}

// experiência
score += Math.min((experienceResult.data?.length ?? 0) * 5, 25);

// cursos
score += Math.min((coursesResult.data?.length ?? 0) * 3, 15);

// estágios
score += Math.min((internshipsResult.data?.length ?? 0) * 2, 10);

// clamp
score = Math.max(0, Math.min(100, score));

     if (!educationMatch) {
  score = Math.min(score, 39);
}

      // =====================================
      // MOCK AI SAFE HANDLING
      // =====================================

      let analysis;

      try {
        analysis = await callAI<{
          summary: string;
          strengths: string[];
          weaknesses: string[];
        }>({
          messages: [
            {
              role: "system",
              content:
                "És especialista em recrutamento público. Apenas explicas resultados.",
            },
            {
              role: "user",
content: `
Nome: ${profile.full_name}

Formação:
${JSON.stringify(educationResult.data)}

Experiência:
${JSON.stringify(experienceResult.data)}

Cursos:
${JSON.stringify(coursesResult.data)}

Estágios:
${JSON.stringify(internshipsResult.data)}

Cargo:
${app.contest_positions?.occupations?.name}

Habilitação exigida:
${app.contests?.education_level}

Score:
${score}

Produz um resumo único deste candidato.
`
            },
          ],
          jsonSchema: {
            name: "candidate_analysis",
            schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
              },
              required: ["summary", "strengths", "weaknesses"],
              additionalProperties: false,
            },
          },
        });
      } catch (aiError) {
        console.warn("⚠️ AI fallback activated (MOCK or error):", aiError);

        analysis = {
          summary: "Análise automática baseada em regras internas do sistema.",
          strengths: [],
          weaknesses: [],
        };
      }

      console.log("MOCK_AI =", process.env.MOCK_AI);
      console.log(
  "Prompt data",
  {
    name: profile.full_name,
    education: profile.education_level,
    experience: experienceResult.data?.length,
    courses: coursesResult.data?.length,
    internships: internshipsResult.data?.length,
    score,
  }
);


      

      // =====================================
      // UPDATE DB
      // =====================================
      const { error: updateError } = await context.supabase
        .from("applications")
        .update({
          final_score: score,
          ai_analysis: {
            ...analysis,
            score,
            education_match: educationMatch,
            required_education: requiredEducation,
candidate_education: candidateEducation,
            mock_ai: process.env.MOCK_AI === "true",
          },
          notes: analysis.summary,
          status:
  score >= 50 && educationMatch
    ? "Avaliação documental-Aprovado"
    : "Avaliação documental-Rejeitado",
        })
        .eq("id", data.applicationId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      return {
        analysis: {
          ...analysis,
          score,
          education_match: educationMatch,
        },
      };

    } catch (err: any) {
      console.error("❌ analyzeCandidateProfile error:", err);
      throw new Error(err.message || "Erro interno na análise");
    }
  });