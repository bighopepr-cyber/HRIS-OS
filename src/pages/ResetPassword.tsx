import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, PartyPopper } from "lucide-react";
import hrHubLogo from "@/assets/hr-hub-logo.svg";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  // Tautan undangan mengarah ke sini dengan ?welcome=1: karyawan baru memilih kata sandi pertamanya.
  const [searchParams] = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "1";

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setIsValidSession(true);
        setChecking(false);
      }
    });

    // Periksa apakah sudah ada sesi yang valid (token pemulihan sudah diproses)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidSession(true);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: "Kesalahan", description: "Kata sandi minimal terdiri dari 6 karakter.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Kesalahan", description: "Kata sandi tidak cocok.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      toast({ title: "Kesalahan", description: error.message, variant: "destructive" });
    } else {
      toast(
        isWelcome
          ? { title: "Semua siap", description: "Akun Anda siap digunakan. Mulai sekarang, masuklah dengan email Anda dan kata sandi ini." }
          : { title: "Kata sandi diperbarui", description: "Kata sandi Anda berhasil diatur ulang." },
      );
      navigate("/dashboard", { replace: true });
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md border-border">
          <CardHeader className="text-center">
            <Link to="/" className="mx-auto mb-4 block w-fit" aria-label="Beranda Peoplo">
              <img src={hrHubLogo} alt="" className="h-12 w-auto" />
            </Link>
            <h1 className="text-2xl font-semibold leading-none tracking-tight">{isWelcome ? "Undangan ini telah kedaluwarsa" : "Tautan tidak valid atau telah kedaluwarsa"}</h1>
            <CardDescription>
              {isWelcome
                ? "Tautan undangan berlaku selama 24 jam. Hubungi tim HR Anda untuk meminta tautan baru."
                : "Tautan pengaturan ulang kata sandi ini tidak valid atau telah kedaluwarsa. Silakan minta tautan baru."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/auth")}>Kembali ke halaman masuk</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto mb-4 block w-fit" aria-label="Beranda Peoplo">
              <img src={hrHubLogo} alt="" className="h-12 w-auto" />
            </Link>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {isWelcome ? (
              <PartyPopper className="h-6 w-6 text-primary" aria-hidden="true" />
            ) : (
              <Lock className="h-6 w-6 text-primary" aria-hidden="true" />
            )}
          </div>
          <h1 className="text-2xl font-semibold leading-none tracking-tight">
            {isWelcome ? "Selamat datang di Peoplo" : "Tetapkan kata sandi baru"}
          </h1>
          <CardDescription>
            {isWelcome
              ? "Pilih kata sandi untuk menyelesaikan pengaturan akun Anda. Gunakan kata sandi tersebut beserta email kerja Anda untuk masuk."
              : "Masukkan kata sandi baru Anda di bawah ini."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{isWelcome ? "Kata sandi" : "Kata sandi baru"}</Label>
              <Input id="new-password" type="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Konfirmasi kata sandi</Label>
              <Input id="confirm-password" type="password" autoComplete="new-password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memperbarui...</>) : isWelcome ? "Tetapkan kata sandi dan lanjutkan" : "Perbarui kata sandi"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
