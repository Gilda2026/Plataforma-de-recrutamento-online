import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, FileSearch, MessageSquare, ClipboardCheck, BarChart3, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Talvio — Recrutamento inteligente com IA" },
      { name: "description", content: "Analise CVs, conduza entrevistas automáticas e aplique testes online com IA. Classifique candidatos em segundos." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">Talvio</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a href="#features" className="text-muted-foreground hover:text-foreground">Funcionalidades</a>
            <a href="#workflow" className="text-muted-foreground hover:text-foreground">Como funciona</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground">Preços</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">Entrar</Link>
            <Button asChild size="sm"><Link to="/auth">Começar grátis</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute inset-0 -z-10 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, oklch(0.7 0.15 245) 0%, transparent 40%), radial-gradient(circle at 80% 60%, oklch(0.6 0.12 240) 0%, transparent 50%)",
        }} />
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="max-w-3xl text-primary-foreground">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs backdrop-blur">
              <Sparkles className="h-3 w-3" /> Powered by Lovable AI
            </div>
            <h1 className="font-display text-5xl font-bold leading-tight md:text-6xl">
              Recrute mais rápido, com inteligência artificial em cada passo.
            </h1>
            <p className="mt-6 text-lg text-white/80 md:text-xl">
              A Talvio analisa CVs, conduz entrevistas automáticas, aplica testes técnicos e classifica candidatos — para que a sua equipa de RH se foque apenas nos melhores.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link to="/auth">Começar grátis <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                <a href="#features">Ver funcionalidades</a>
              </Button>
            </div>
            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/70">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Sem cartão de crédito</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Setup em 2 minutos</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> RGPD compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold">Tudo o que precisa, num só lugar</h2>
          <p className="mt-4 text-muted-foreground">Uma plataforma completa de recrutamento digital, alimentada por IA.</p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: FileSearch, title: "Análise de CV", desc: "Extrai competências, experiência e calcula fit-score para o cargo." },
            { icon: MessageSquare, title: "Entrevistas IA", desc: "Gera perguntas personalizadas e avalia respostas em tempo real." },
            { icon: ClipboardCheck, title: "Testes online", desc: "Avaliações técnicas de múltipla escolha geradas por IA." },
            { icon: BarChart3, title: "Classificação", desc: "Ranking automático dos candidatos com base em scores ponderados." },
          ].map((f) => (
            <div key={f.title} className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-accent/40" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/5 text-accent">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="border-y border-border bg-secondary/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold">Do CV à decisão em minutos</h2>
            <p className="mt-4 text-muted-foreground">Um fluxo simples, totalmente assistido por IA.</p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { n: "01", t: "Cole o CV", d: "Adicione o candidato com nome, cargo-alvo e texto do CV." },
              { n: "02", t: "Entrevista & teste", d: "A IA gera perguntas e testes personalizados ao perfil." },
              { n: "03", t: "Classifique", d: "Receba scores e recomendações para tomar a melhor decisão." },
            ].map((s) => (
              <div key={s.n} className="relative rounded-xl border border-border bg-background p-8">
                <span className="font-display text-5xl font-bold text-accent/30">{s.n}</span>
                <h3 className="mt-4 font-display text-xl font-bold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="mx-auto max-w-4xl px-6 py-24 text-center">
        <Brain className="mx-auto h-12 w-12 text-accent" />
        <h2 className="mt-6 font-display text-4xl font-bold">Pronto para recrutar com IA?</h2>
        <p className="mt-4 text-muted-foreground">Comece grátis hoje. Sem cartão, sem compromisso.</p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/auth">Criar conta gratuita <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Talvio · Plataforma de recrutamento com IA
        </div>
      </footer>
    </div>
  );
}
