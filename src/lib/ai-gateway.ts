// Server-only helper for calling Lovable AI Gateway.
// Imported only from *.functions.ts handlers.

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function callAI<T = unknown>(opts: {
  model?: string;
  messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  jsonSchema?: {
    name: string;
    schema: Record<string, unknown>;
  };
}): Promise<T> {

  // =========================
  // DEV MODE (SEM IA)
  // =========================

  // if (
  //   process.env.NODE_ENV === "development" &&
  //   !process.env.LOVABLE_API_KEY
  // ) {

  //   console.log(
  //     "MOCK AI ENABLED"
  //   );

  //   return {
  //     score: 78,
  //     summary:
  //       "Candidato com perfil promissor e experiência relevante.",

  //     strengths: [
  //       "Boa formação",
  //       "Experiência profissional",
  //       "Cursos relevantes",
  //     ],

  //     weaknesses: [
  //       "Pouca experiência prática",
  //     ],
  //   } as T;
  // }

  if (
  process.env.NODE_ENV === "development" &&
  !process.env.LOVABLE_API_KEY
) {

  console.log("SMART MOCK AI ENABLED");

  const prompt =
    opts.messages
      .map(m => m.content)
      .join("\n");

  const scoreMatch =
    prompt.match(/Score:\s*(\d+)/i);

  const score =
    scoreMatch
      ? Number(scoreMatch[1])
      : 0;

  return {
    summary:
      score >= 70
        ? "Candidato apresenta forte alinhamento com os requisitos do concurso."
        : score >= 50
        ? "Candidato cumpre parcialmente os requisitos definidos."
        : "Candidato não demonstra os requisitos mínimos exigidos.",

    strengths:
      score >= 70
        ? [
            "Cumpre os requisitos académicos",
            "Perfil competitivo",
            "Boa adequação ao concurso",
          ]
        : score >= 50
        ? [
            "Possui alguns requisitos relevantes",
            "Potencial de desenvolvimento",
          ]
        : [
            "Alguma formação registada",
          ],

    weaknesses:
      score >= 70
        ? [
            "Pode beneficiar de experiência adicional",
          ]
        : score >= 50
        ? [
            "Experiência limitada",
            "Formação complementar recomendada",
          ]
        : [
            "Não cumpre totalmente os requisitos mínimos",
            "Perfil pouco alinhado com a vaga",
          ],
  } as T;
}

  // =========================
  // REAL IA
  // =========================

  const key =
    process.env.LOVABLE_API_KEY;

  if (!key) {
    throw new Error(
      "LOVABLE_API_KEY is not configured"
    );
  }

  // resto do fetch...


  const body: Record<string, unknown> = {
    model: opts.model ?? "google/gemini-2.5-flash",
    messages: opts.messages,
  };
  if (opts.jsonSchema) {
    body.response_format = {
      type: "json_schema",
      json_schema: { name: opts.jsonSchema.name, schema: opts.jsonSchema.schema, strict: true },
    };
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    if (res.status === 429) throw new Error("Limite de pedidos atingido. Tente novamente em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
    throw new Error(`Erro IA (${res.status}): ${txt.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  if (opts.jsonSchema) {
    try {
      return JSON.parse(content) as T;
    } catch {
      // Try to extract JSON
      const m = content.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]) as T;
      throw new Error("Resposta da IA não é JSON válido");
    }
  }
  return content as T;
}
