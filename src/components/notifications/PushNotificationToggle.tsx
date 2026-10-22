import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";

export function PushNotificationToggle() {
  const { isSupported, isSubscribed, permission, isLoading, subscribe, unsubscribe } = usePushNotifications();
  const { toast } = useToast();

  if (!isSupported) return null;

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast({ title: "Notifikasi push dinonaktifkan", description: "Anda tidak akan menerima notifikasi push lagi." });
    } else {
      const success = await subscribe();
      if (success) {
        toast({ title: "Notifikasi push diaktifkan!", description: "Anda sekarang akan menerima peringatan untuk persetujuan cuti dan pembaruan HR lainnya." });
      } else if (permission === "denied") {
        toast({
          title: "Notifikasi diblokir",
          description: "Aktifkan notifikasi di pengaturan browser Anda.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-2xl">
          <BellRing className="h-5 w-5 shrink-0" aria-hidden="true" />
          Notifikasi push
        </CardTitle>
        <CardDescription>
          Dapatkan peringatan instan di perangkat Anda untuk persetujuan cuti, permintaan baru, dan pengingat kehadiran
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium">
              {isSubscribed ? "Notifikasi diaktifkan" : "Notifikasi dinonaktifkan"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isSubscribed
                ? "Anda akan menerima pemberitahuan push meskipun aplikasi ditutup"
                : "Aktifkan untuk menerima peringatan HR real-time di perangkat Anda"}
            </p>
          </div>
          <Button
            variant={isSubscribed ? "outline" : "default"}
            size="sm"
            onClick={handleToggle}
            disabled={isLoading}
            className="shrink-0 gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSubscribed ? (
              <BellOff className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {isSubscribed ? "Nonaktifkan" : "Aktifkan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
