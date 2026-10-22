import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationPreferences, useUpdateNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { PushNotificationToggle } from "@/components/notifications/PushNotificationToggle";
import { toast } from "sonner";
import { Bell, Mail, Calendar, FileCheck, Target, UserPlus, PartyPopper, Clock } from "lucide-react";

const NotificationPreferences = () => {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  const handleToggle = async (key: string, value: boolean) => {
    try {
      await updatePreferences.mutateAsync({ [key]: value });
      toast.success("Preferensi diperbarui");
    } catch (error) {
      toast.error("Gagal memperbarui preferensi");
    }
  };

  const notificationTypes = [
    {
      key: "event_notifications",
      label: "Acara perusahaan",
      description: "Diberitahukan tentang acara dan rapat perusahaan yang akan datang",
      icon: Calendar,
    },
    {
      key: "holiday_notifications",
      label: "Hari libur",
      description: "Terima pengingat tentang hari libur yang akan datang",
      icon: PartyPopper,
    },
    {
      key: "leave_status_notifications",
      label: "Status cuti",
      description: "Diberitahukan saat permintaan cuti disetujui atau ditolak",
      icon: FileCheck,
    },
    {
      key: "review_notifications",
      label: "Ulasan kinerja",
      description: "Terima notifikasi tentang jadwal dan pembaruan ulasan kinerja",
      icon: Bell,
    },
    {
      key: "goal_reminder_notifications",
      label: "Pengingat tujuan",
      description: "Dapat pengingat tentang tenggat waktu tujuan yang akan datang",
      icon: Target,
    },
    {
      key: "onboarding_notifications",
      label: "Pembaruan onboarding",
      description: "Terima notifikasi tentang tugas dan kemajuan onboarding",
      icon: UserPlus,
    },
    {
      key: "attendance_reminder_notifications",
      label: "Pengingat absensi",
      description: "Dapat pengingat untuk clock in dan clock out pada hari kerja",
      icon: Clock,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Preferensi notifikasi</h1>
          <p className="text-muted-foreground">
            Pilih bagaimana dan kapan HRISINDO memberitahu Anda — di perangkat ini dan melalui surel
          </p>
        </div>

        <PushNotificationToggle />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-2xl">
              <Mail className="h-5 w-5 shrink-0" aria-hidden="true" />
              Notifikasi surel
            </CardTitle>
            <CardDescription>
              Pilih pembaruan mana yang dikirim ke surel Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-3">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <Skeleton className="h-6 w-11" />
                </div>
              ))
            ) : (
              notificationTypes.map((type) => {
                const Icon = type.icon;
                const isEnabled = preferences?.[type.key as keyof typeof preferences] as boolean;
                
                return (
                  <div
                    key={type.key}
                    className="flex items-center justify-between gap-4 border-b py-4 first:pt-0 last:border-0 last:pb-0"
                  >
                    <div className="grid min-w-0 grid-cols-[1.25rem_1fr] items-start gap-3">
                      <Icon className="mt-0.5 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      <div className="min-w-0 space-y-0.5">
                        <Label htmlFor={type.key} className="cursor-pointer text-sm font-medium sm:text-base">
                          {type.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {type.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      className="shrink-0"
                      id={type.key}
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggle(type.key, checked)}
                      disabled={updatePreferences.isPending}
                    />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default NotificationPreferences;
