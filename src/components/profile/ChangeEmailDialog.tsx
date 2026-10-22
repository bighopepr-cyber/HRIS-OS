import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { checkEmailDomainAllowed } from "@/lib/domainWhitelist";

const emailSchema = z.string().trim().email("Silakan masukkan alamat email yang valid");

interface ChangeEmailDialogProps {
  currentEmail: string;
}

export function ChangeEmailDialog({ currentEmail }: ChangeEmailDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"email" | "code">("email");
  const [newEmail, setNewEmail] = useState("");
  const [currentEmailCode, setCurrentEmailCode] = useState("");
  const [newEmailCode, setNewEmailCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetAndClose = () => {
    setOpen(false);
    setStep("email");
    setNewEmail("");
    setCurrentEmailCode("");
    setNewEmailCode("");
  };

  const handleSendCode = async () => {
    const result = emailSchema.safeParse(newEmail);
    if (!result.success) {
      toast({ title: "Kesalahan", description: result.error.errors[0].message, variant: "destructive" });
      return;
    }

    if (result.data.toLowerCase() === currentEmail.toLowerCase()) {
      toast({ title: "Kesalahan", description: "Itu sudah email Anda saat ini.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const domainCheck = await checkEmailDomainAllowed(result.data);
    if (!domainCheck.allowed) {
      setIsSubmitting(false);
      toast({ title: "Domain Tidak Diizinkan", description: domainCheck.message, variant: "destructive" });
      return;
    }

    const { error } = await supabase.auth.updateUser({ email: result.data });
    setIsSubmitting(false);

    if (error) {
      toast({ title: "Kesalahan", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Kode Terkirim",
      description: `Cek Both ${currentEmail} dan ${result.data} — masing-masing dapat kode berbeda, dan keduanya diperlukan untuk mengonfirmasi perubahan.`,
    });
    setStep("code");
  };

  const handleVerifyCode = async () => {
    if (!currentEmailCode.trim() || !newEmailCode.trim()) {
      toast({
        title: "Kesalahan",
        description: "Masukkan kedua kode — satu dari email saat ini, satu dari email baru.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error: currentError } = await supabase.auth.verifyOtp({
      email: currentEmail,
      token: currentEmailCode,
      type: "email_change",
    });

    if (currentError) {
      setIsSubmitting(false);
      toast({
        title: "Kesalahan mengonfirmasi email saat ini",
        description: currentError.message,
        variant: "destructive",
      });
      return;
    }

    const { error: newError } = await supabase.auth.verifyOtp({
      email: newEmail,
      token: newEmailCode,
      type: "email_change",
    });
    setIsSubmitting(false);

    if (newError) {
      toast({ title: "Kesalahan mengonfirmasi email baru", description: newError.message, variant: "destructive" });
      return;
    }

    toast({ title: "Email diperbarui", description: "Surel Anda telah diubah." });
    resetAndClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : resetAndClose())}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-10 shrink-0 self-start sm:self-auto">
          <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
          Ubah surel
        </Button>
      </DialogTrigger>
      <DialogContent>
        {step === "email" ? (
          <>
            <DialogHeader>
              <DialogTitle>Ubah alamat surel</DialogTitle>
              <DialogDescription>
                Kami akan mengirimkan kode konfirmasi ke surel saat ini dan surel baru Anda. Surel masuk Anda tidak akan berubah
                sampai Anda mengonfirmasi keduanya.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="current-email">Surel saat ini</Label>
                <Input id="current-email" value={currentEmail} readOnly className="cursor-default bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">Surel baru</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="anda@perusahaan.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetAndClose}>
                Batal
              </Button>
              <Button onClick={handleSendCode} disabled={isSubmitting || !newEmail}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kirim kode
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Masukkan kode konfirmasi</DialogTitle>
              <DialogDescription>
                Dua kode berbeda dikirim — satu ke surel saat ini, satu ke surel baru Anda. Masukkan keduanya untuk
                mengonfirmasi perubahan.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="current-email-code" className="break-words">Kode dari {currentEmail}</Label>
                <Input
                  id="current-email-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={currentEmailCode}
                  onChange={(e) => setCurrentEmailCode(e.target.value)}
                  placeholder="Masukkan kode"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email-code" className="break-words">Kode dari {newEmail}</Label>
                <Input
                  id="new-email-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={newEmailCode}
                  onChange={(e) => setNewEmailCode(e.target.value)}
                  placeholder="Masukkan kode"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("email")}>
                Kembali
              </Button>
              <Button
                onClick={handleVerifyCode}
                disabled={isSubmitting || !currentEmailCode.trim() || !newEmailCode.trim()}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Konfirmasi
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
