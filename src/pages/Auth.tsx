import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, ArrowLeft, ArrowRight, Code2, Lock, Mail, ShieldCheck } from "lucide-react";
import { z } from "zod";
import hrHubLogo from "@/assets/hr-hub-logo.svg";
import { supabase } from "@/integrations/supabase/client";
import { Backdrop } from "@/components/landing/Backdrop";
import { HeroScene } from "@/components/landing/HeroScene";
import { DEMO_URL } from "@/components/layout/publicSite";
import { REPO_URL } from "@/lib/site";

const loginSchema = z.object({
  email: z.string().trim().email("Silakan masukkan alamat email yang valid"),
  password: z.string().min(6, "Kata sandi harus minimal 6 karakter"),
});

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[`login_${err.path[0]}`] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast({
          title: "Masuk Gagal",
          description: "Email atau kata sandi tidak valid. Silakan coba lagi.",
          variant: "destructive",
        });
      } else if (error.message.includes("Email not confirmed")) {
        toast({
          title: "Email Belum Terverifikasi",
          description: "Silakan periksa email dan verifikasi akun Anda terlebih dahulu.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Masuk Gagal",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
if (!resetEmail.trim()) {
        toast({ title: "Kesalahan", description: "Silakan masukkan alamat email Anda.", variant: "destructive" });
        return;
      }
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setIsLoading(false);
      if (error) {
        toast({ title: "Kesalahan", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Email terkirim", description: "Cek email Anda untuk tautan reset kata sandi." });
        setShowForgotPassword(false);
      }
  };

  const trust = [
    { icon: Code2, text: "Sumber terbuka di bawah AGPL-3.0" },
    { icon: ShieldCheck, text: "Aturan akses ditegakkan di database" },
    { icon: Lock, text: "Akun hanya dengan undangan" },
  ];

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
      <Backdrop />

      <header className="container relative z-10 mx-auto flex items-center justify-between px-4 py-5">
        <Link to="/" className="inline-flex items-center gap-2.5" aria-label="Beranda Peoplo">
          <img src={hrHubLogo} alt="" className="h-9 w-auto" />
          <span className="text-xl font-bold tracking-tight text-foreground">Peoplo</span>
        </Link>
        <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>
              Kembali<span className="hidden sm:inline"> ke beranda</span>
            </span>
          </Link>
        </Button>
      </header>

      <main className="container relative z-10 mx-auto grid flex-1 items-center gap-12 px-4 pb-10 pt-2 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pb-16">
        {/* Brand side (large screens) */}
        <section className="hidden lg:block" aria-label="Tentang Peoplo">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-6 inline-flex animate-fade-up items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-3 py-1 text-sm font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:border-primary/40"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Percuma &amp; sumber terbuka · AGPL-3.0
          </a>
          <h2
            className="mb-4 animate-fade-up text-4xl font-bold tracking-tight text-foreground xl:text-5xl"
            style={{ animationDelay: "80ms" }}
          >
            HR tim Anda,
            <br />
            <span className="text-shimmer animate-shimmer motion-reduce:animate-none">semua dalam satu tempat.</span>
          </h2>
          <p
            className="max-w-lg animate-fade-up text-lg text-muted-foreground"
            style={{ animationDelay: "160ms" }}
          >
            Karyawan, absensi, cuti, gaji, dan kinerja, dengan akses yang Anda kendalikan hingga ke setiap modul.
          </p>
          <div className="mt-16 max-w-xl animate-fade-up pl-14 pr-12" style={{ animationDelay: "220ms" }}>
            <HeroScene />
          </div>
        </section>

        {/* Sign-in card */}
        <section className="mx-auto w-full max-w-md animate-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="rounded-2xl border border-border/80 bg-card/85 p-6 shadow-xl shadow-primary/10 backdrop-blur-md sm:p-8">
            <div className="mb-6 space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {showForgotPassword ? "Atur ulang kata sandi Anda" : "Selamat kembali"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {showForgotPassword
                  ? "Masukkan email kerja dan kami akan mengirimkan tautan untuk menyetel kata sandi baru."
                  : "Masuk ke ruang kerja Peoplo Anda."}
              </p>
            </div>

            {showForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email kerja</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    placeholder="nama@perusahaan.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-11"
                    autoFocus
                  />
                </div>
                <Button type="submit" className="h-11 w-full shadow-lg shadow-primary/20" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    "Kirim tautan reset"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 w-full gap-2"
                  onClick={() => setShowForgotPassword(false)}
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Kembali ke masuk
                </Button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email kerja</Label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="nama@perusahaan.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-11"
                    aria-invalid={!!errors.login_email}
                    aria-describedby={errors.login_email ? "login-email-error" : undefined}
                  />
                  {errors.login_email && (
                    <p id="login-email-error" className="text-sm text-destructive">{errors.login_email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Kata sandi</Label>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-sm"
                      onClick={() => { setShowForgotPassword(true); setResetEmail(loginEmail); }}
                    >
                      Lupa kata sandi?
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-11 pr-11"
                      aria-invalid={!!errors.login_password}
                      aria-describedby={errors.login_password ? "login-password-error" : undefined}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-label={showLoginPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      aria-pressed={showLoginPassword}
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                  {errors.login_password && (
                    <p id="login-password-error" className="text-sm text-destructive">{errors.login_password}</p>
                  )}
                </div>
                <Button type="submit" className="group h-11 w-full gap-2 shadow-lg shadow-primary/20" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sedang masuk...
                    </>
                  ) : (
                    <>
                      Masuk
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 flex gap-3 rounded-xl border border-primary/15 bg-primary/5 p-3 text-sm">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Akun hanya dengan undangan.</span> Bergabung dengan tim? HR Anda akan mengirim email berisi tautan untuk menyiapkan akun.
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Mau gunakan Peoplo untuk perusahaan Anda?{" "}
            <a
              href={DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Pesan Demo
            </a>
          </p>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/60 bg-background/60 backdrop-blur">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-muted-foreground sm:flex-row">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
            {trust.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
          <p>© {new Date().getFullYear()} Peoplo</p>
        </div>
      </footer>
    </div>
  );
};

export default Auth;

