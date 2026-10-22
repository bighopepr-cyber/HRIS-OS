import { UserRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Shown to someone who is signed in but isn't linked to an employee profile and
 * has no module access. New hires are invited from Onboarding with their
 * profile already created, so this mostly covers accounts made some other way.
 */
export function NonEmployeeDashboard() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-[60vh] items-center justify-center sm:p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <UserRound className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight">Selamat datang di Peoplo</h1>
          <CardDescription className="pt-1">
            Akun Anda belum ditautkan ke profil karyawan, jadi tidak ada yang dapat ditampilkan di sini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-center text-sm text-muted-foreground">
          <p>
            Minta tim HR Anda untuk menambahkan Anda di Peoplo menggunakan{" "}
            <span className="break-words font-medium text-foreground">{user?.email}</span>. As soon as they do, your
            dashboard, leave, attendance and payslips appear here. You don't need to do anything else.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
