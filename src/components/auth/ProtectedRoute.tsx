import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployeeStatus } from "@/hooks/useEmployeeStatus";
import { usePermissions } from "@/hooks/usePermissions";
import { ArrowLeft, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/** Ditampilkan (di dalam kerangka aplikasi biasa) ketika seseorang tanpa profil karyawan membuka sebuah modul. */
function NotOnboardedYet() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold leading-tight sm:text-2xl">Belum tersedia</h1>
          <CardDescription className="pt-1">
            Halaman ini diperuntukkan bagi karyawan. Halaman ini akan terbuka setelah HR menautkan akun Anda ke profil karyawan Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild className="gap-2">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Kembali ke dasbor
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const { data: employeeStatus, isLoading: isEmployeeLoading } = useEmployeeStatus();
  const { hasAnyModuleAccess, isLoading: isRoleLoading } = usePermissions();
  const isEmployee = employeeStatus?.isEmployee ?? false;

  if (isLoading || isEmployeeLoading || isRoleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Memuat" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Semua orang dapat membuka dasbor; orang tanpa profil karyawan akan melihat
  // penjelasan singkat di sana
  const isDashboard = location.pathname === "/dashboard";

  // Pengguna tanpa catatan karyawan hanya dapat menggunakan aplikasi jika mereka
  // telah diberi akses ke sebuah modul (misalnya akuntan eksternal dengan akses gaji)
  if (!isEmployee && !hasAnyModuleAccess && !isDashboard) {
    return (
      <DashboardLayout>
        <NotOnboardedYet />
      </DashboardLayout>
    );
  }

  return <>{children}</>;
}
