// import { useEffect, useState } from "react";
// import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
// import { useAuth } from "@/hooks/use-auth";
// import { toast } from "sonner";
// import { supabase } from "@/integrations/supabase/client";
// import { lovable } from "@/integrations/lovable";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Sparkles } from "lucide-react";

// export const Route = createFileRoute("/auth")({
//   head: () => ({ meta: [{ title: "Entrar — Talvio" }, { name: "description", content: "Entre na sua conta Talvio." }] }),
//   component: AuthPage,
// });

// function AuthPage() {
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   // Redireciona para /dashboard assim que existir sessão (após Google OAuth, etc.)
//   useEffect(() => {
//     if (user) navigate({ to: "/dashboard" });
//   }, [user, navigate]);


//   async function signIn() {
//     setLoading(true);
//     const { error } = await supabase.auth.signInWithPassword({ email, password });
//     setLoading(false);
//     if (error) {
//       if (error.message.toLowerCase().includes("invalid login credentials")) {
//         return toast.error("Credenciais inválidas. Se criou a conta com Google, use 'Continuar com Google'.");
//       }
//       return toast.error(error.message);
//     }
//     toast.success("Sessão iniciada");
//     navigate({ to: "/dashboard" });
//   }

//   async function forgotPassword() {
//     if (!email) return toast.error("Introduza o e-mail primeiro.");
//     const { error } = await supabase.auth.resetPasswordForEmail(email, {
//       redirectTo: window.location.origin + "/reset-password",
//     });
//     if (error) return toast.error(error.message);
//     toast.success("E-mail de recuperação enviado (verifique a caixa de entrada).");
//   }

//   async function signUp() {
//     setLoading(true);
//     const { error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: { emailRedirectTo: window.location.origin + "/dashboard" },
//     });
//     setLoading(false);
//     if (error) return toast.error(error.message);
//     toast.success("Conta criada — pode entrar.");
//     navigate({ to: "/dashboard" });
//   }

//   async function google() {
//     const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
//     if (r.error) toast.error("Falha no login com Google");
//   }

//   return (
//     <div className="grid min-h-screen md:grid-cols-2">
//       <div className="hidden md:flex flex-col justify-between p-12 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
//         <Link to="/" className="flex items-center gap-2">
//           <div className="grid h-8 w-8 place-items-center rounded-md bg-white/10"><Sparkles className="h-4 w-4" /></div>
//           <span className="font-display text-lg font-bold">Talvio</span>
//         </Link>
//         <div>
//           <h2 className="font-display text-4xl font-bold leading-tight">Recrute com IA. Decida com confiança.</h2>
//           <p className="mt-4 text-white/80">A plataforma que faz triagem, entrevistas e testes por si.</p>
//         </div>
//         <p className="text-xs text-white/60">© Talvio</p>
//       </div>

//       <div className="flex items-center justify-center p-6">
//         <div className="w-full max-w-sm">
//           <Link to="/" className="md:hidden mb-8 flex items-center gap-2">
//             <Sparkles className="h-5 w-5 text-accent" />
//             <span className="font-display text-lg font-bold">Talvio</span>
//           </Link>
//           <h1 className="font-display text-3xl font-bold">Bem-vindo</h1>
//           <p className="mt-2 text-sm text-muted-foreground">Entre ou crie a sua conta para começar.</p>

//           <Button variant="outline" className="mt-6 w-full" onClick={google}>
//             <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
//             Continuar com Google
//           </Button>

//           <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
//             <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
//           </div>

//           <Tabs defaultValue="signin">
//             <TabsList className="grid w-full grid-cols-2">
//               <TabsTrigger value="signin">Entrar</TabsTrigger>
//               <TabsTrigger value="signup">Criar conta</TabsTrigger>
//             </TabsList>
//             <TabsContent value="signin" className="space-y-3 pt-4">
//               <div><Label htmlFor="e1">E-mail</Label><Input id="e1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
//               <div><Label htmlFor="p1">Palavra-passe</Label><Input id="p1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
//               <Button className="w-full" onClick={signIn} disabled={loading}>Entrar</Button>
//               <button type="button" onClick={forgotPassword} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">Esqueci-me da palavra-passe</button>
//             </TabsContent>
//             <TabsContent value="signup" className="space-y-3 pt-4">
//               <div><Label htmlFor="e2">E-mail</Label><Input id="e2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
//               <div><Label htmlFor="p2">Palavra-passe</Label><Input id="p2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
//               <Button className="w-full" onClick={signUp} disabled={loading}>Criar conta</Button>
//             </TabsContent>
//           </Tabs>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";


export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Talvio" },
      { name: "description", content: "Entre na sua conta Talvio." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // (opcional) só redireciona se já estiver logado
  useEffect(() => {
  if (user) {
    redirectByRole(user.id);
  }
}, [user]);

  // 🔥 função central de redirect por role
async function redirectByRole(userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  console.log("USER ID:", userId);
  console.log("ROLES:", data);
  console.log("ERROR:", error?.message);

  const roles = data?.map((r) => r.role) ?? [];

  if (roles.includes("admin")) {
    navigate({ to: "/admin" });
  } else if (roles.includes("gestor")) {
    navigate({ to: "/dashboard" });
  } else {
    navigate({ to: "/concursos" });
  }
}

  async function signIn() {
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("invalid login credentials")) {
        return toast.error(
          "Credenciais inválidas. Se criou a conta com Google, use 'Continuar com Google'."
        );
      }
      return toast.error(error.message);
    }

    toast.success("Sessão iniciada");

    if (data.user) {
      await redirectByRole(data.user.id);
    }
  }

  async function forgotPassword() {
    if (!email) return toast.error("Introduza o e-mail primeiro.");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });

    if (error) return toast.error(error.message);

    toast.success("E-mail de recuperação enviado.");
  }

  async function signUp() {
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) return toast.error(error.message);

    toast.success("Conta criada — pode entrar.");

    if (data.user) {
      await redirectByRole(data.user.id);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });

    if (r.error) toast.error("Falha no login com Google");
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div
        className="hidden md:flex flex-col justify-between p-12 text-primary-foreground"
        style={{ background: "var(--gradient-hero)" }}
      >
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-white/10">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-bold">Talvio</span>
        </Link>

        <div>
          <h2 className="font-display text-4xl font-bold leading-tight">
            Recrute com IA. Decida com confiança.
          </h2>
          <p className="mt-4 text-white/80">
            A plataforma que faz triagem, entrevistas e testes por si.
          </p>
        </div>

        <p className="text-xs text-white/60">© Talvio</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="md:hidden mb-8 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <span className="font-display text-lg font-bold">Talvio</span>
          </Link>

          <h1 className="font-display text-3xl font-bold">Bem-vindo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre ou crie a sua conta.
          </p>

          <Button variant="outline" className="mt-6 w-full" onClick={google}>
            Continuar com Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> ou{" "}
            <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-3 pt-4">
              <div>
                <Label>E-mail</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Label>Palavra-passe</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button className="w-full" onClick={signIn} disabled={loading}>
                Entrar
              </Button>

              <button
                type="button"
                onClick={forgotPassword}
                className="text-xs underline"
              >
                Esqueci-me da palavra-passe
              </button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-3 pt-4">
              <div>
                <Label>E-mail</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Label>Palavra-passe</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button className="w-full" onClick={signUp} disabled={loading}>
                Criar conta
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
