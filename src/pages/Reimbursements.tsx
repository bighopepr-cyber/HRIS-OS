import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReimbursementCard } from "@/components/reimbursements/ReimbursementCard";
import { ReimbursementRequestForm } from "@/components/reimbursements/ReimbursementRequestForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Receipt, Plus, Clock, CheckCircle, XCircle, Banknote, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  useReimbursementRequests,
  useReimbursementStats,
  useUpdateReimbursementStatus,
  ReimbursementRequest,
} from "@/hooks/useReimbursements";
import { usePermissions } from "@/hooks/usePermissions";
import { formatCurrency } from "@/lib/currency";

const Reimbursements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const { can, roles } = usePermissions();

  const [selectedRequest, setSelectedRequest] = useState<ReimbursementRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | "paid" | null>(null);

  // Manajer menyetujui laporan timnya (RLS membatasi mereka pada timnya);
  // reimbursements:manage dapat menyetujui siapa pun dan menandai klaim sebagai dibayar
  const canApprove = can("reimbursements", "manage") || roles.includes("manager");
  const canSeeOthersRequests = canApprove || can("reimbursements", "view");
  const canMarkPaid = can("reimbursements", "manage");

  const { data: myEmployeeId, isLoading: isLoadingMyEmployee } = useQuery({
    queryKey: ["my-employee-id", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.from("employees").select("id").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
    enabled: !!user?.id,
  });

  const { data: requests = [], isLoading } = useReimbursementRequests();
  const { data: stats } = useReimbursementStats();
  const updateStatusMutation = useUpdateReimbursementStatus();

  const getDocumentUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("reimbursement-receipts")
      .createSignedUrl(filePath, 3600);

    if (error) {
      toast({ title: "Kesalahan", description: "Gagal mendapatkan URL bukti", variant: "destructive" });
      return null;
    }
    return data.signedUrl;
  };

  const handleViewReceipt = async (filePath: string) => {
    const url = await getDocumentUrl(filePath);
    if (url) window.open(url, "_blank");
  };

  const handleApprove = (id: string) => {
    const request = requests.find((r) => r.id === id);
    if (request) {
      setSelectedRequest(request);
      setActionType("approve");
      setReviewNotes("");
    }
  };

  const handleReject = (id: string) => {
    const request = requests.find((r) => r.id === id);
    if (request) {
      setSelectedRequest(request);
      setActionType("reject");
      setReviewNotes("");
    }
  };

  const handleMarkPaid = (id: string) => {
    const request = requests.find((r) => r.id === id);
    if (request) {
      setSelectedRequest(request);
      setActionType("paid");
      setReviewNotes("");
    }
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    const { data: reviewerEmployee } = await supabase
      .from("employees")
      .select("id, first_name, last_name")
      .eq("user_id", user?.id)
      .maybeSingle();

    const reviewerName = reviewerEmployee
      ? `${reviewerEmployee.first_name} ${reviewerEmployee.last_name}`
      : "Tim HR";

    const status = actionType === "approve" ? "approved" : actionType === "reject" ? "rejected" : "paid";

    await updateStatusMutation.mutateAsync({
      requestId: selectedRequest.id,
      status,
      reviewerId: reviewerEmployee?.id || null,
      reviewerName,
      reviewNotes,
    });

    toast({
      title: status === "approved" ? "Klaim Disetujui" : status === "rejected" ? "Klaim Ditolak" : "Ditandai Sudah Dibayar",
      description: `Permintaan reimbursement telah ${status === "approved" ? "disetujui" : status === "rejected" ? "ditolak" : "ditandai sudah dibayar"}.`,
    });
    setSelectedRequest(null);
    setReviewNotes("");
    setActionType(null);
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const processedRequests = requests.filter((r) => r.status === "rejected" || r.status === "paid");

  const reimbursementStats = [
    { label: "Tertunda", value: stats?.pending || 0, icon: <Clock className="h-5 w-5" />, color: "text-amber-600" },
    { label: "Disetujui", value: stats?.approved || 0, icon: <CheckCircle className="h-5 w-5" />, color: "text-emerald-600" },
    { label: "Ditolak", value: stats?.rejected || 0, icon: <XCircle className="h-5 w-5" />, color: "text-destructive" },
    { label: "Dibayar", value: stats?.paid || 0, icon: <Banknote className="h-5 w-5" />, color: "text-primary" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Reimbursement</h1>
            <p className="text-muted-foreground">Kirim dan lacak klaim pengeluaran</p>
          </div>
          <div className="flex gap-2">
          <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-none">
                <Plus className="mr-2 h-4 w-4" />
                Klaim baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Klaim pengeluaran baru</DialogTitle>
                <DialogDescription>Kirim permintaan reimbursement untuk persetujuan.</DialogDescription>
              </DialogHeader>

              {isLoadingMyEmployee ? (
                <Skeleton className="h-72 w-full" />
              ) : !myEmployeeId ? (
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  Kami tidak menemukan profil karyawan yang terhubung dengan akun Anda. Silakan hubungi HR untuk menautkan profil Anda.
                </div>
              ) : (
                <ReimbursementRequestForm
                  employeeId={myEmployeeId}
                  onSubmitted={() => setIsNewRequestOpen(false)}
                  onCancel={() => setIsNewRequestOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {reimbursementStats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
                <div className={`shrink-0 rounded-xl bg-muted p-2.5 sm:p-3 ${stat.color}`}>{stat.icon}</div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-foreground sm:text-2xl">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Tertunda
              <Badge variant="secondary" className="ml-2">
                {pendingRequests.length}
              </Badge>
            </TabsTrigger>
            {canSeeOthersRequests && (
              <TabsTrigger value="approved">
                Disetujui
                <Badge variant="secondary" className="ml-2">
                  {approvedRequests.length}
                </Badge>
              </TabsTrigger>
            )}
            <TabsTrigger value="processed">Diproses</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6 space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            ) : pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Receipt className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">Tidak ada klaim tertunda</h3>
                  <p className="text-muted-foreground">Semua klaim pengeluaran telah diproses</p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map((request) => {
                const isOwnRequest = myEmployeeId && request.employeeId === myEmployeeId;
                const canApproveThisRequest = canApprove && !isOwnRequest;
                return (
                  <ReimbursementCard
                    key={request.id}
                    request={request}
                    onApprove={canApproveThisRequest ? handleApprove : undefined}
                    onReject={canApproveThisRequest ? handleReject : undefined}
                    onViewReceipt={handleViewReceipt}
                  />
                );
              })
            )}
          </TabsContent>

          {canSeeOthersRequests && (
            <TabsContent value="approved" className="mt-6 space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-xl" />
                  ))}
                </div>
              ) : approvedRequests.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Banknote className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-semibold text-foreground">Tidak ada yang menunggu pembayaran</h3>
                    <p className="text-muted-foreground">Klaim yang disetujui dan menunggu pembayaran akan muncul di sini</p>
                  </CardContent>
                </Card>
              ) : (
                approvedRequests.map((request) => (
                  <ReimbursementCard
                    key={request.id}
                    request={request}
                    onMarkPaid={canMarkPaid ? handleMarkPaid : undefined}
                    onViewReceipt={handleViewReceipt}
                  />
                ))
              )}
            </TabsContent>
          )}

          <TabsContent value="processed" className="mt-6 space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            ) : processedRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Receipt className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">Tidak ada klaim yang diproses</h3>
                  <p className="text-muted-foreground">Klaim yang ditolak dan dibayar akan muncul di sini</p>
                </CardContent>
              </Card>
            ) : (
              processedRequests.map((request) => (
                <ReimbursementCard key={request.id} request={request} onViewReceipt={handleViewReceipt} />
              ))
            )}
          </TabsContent>
        </Tabs>

        <Dialog
          open={!!selectedRequest && !!actionType}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedRequest(null);
              setActionType(null);
              setReviewNotes("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "approve"
                  ? "Setujui reimbursement"
                  : actionType === "reject"
                  ? "Tolak reimbursement"
                  : "Tandai reimbursement sebagai dibayar"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve"
                  ? "Anda yakin ingin menyetujui klaim pengeluaran ini?"
                  : actionType === "reject"
                  ? "Anda yakin ingin menolak klaim pengeluaran ini?"
                  : "Konfirmasi bahwa klaim pengeluaran ini telah dibayarkan."}
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4">
                <div className="space-y-1.5 rounded-lg border bg-muted/50 p-4">
                  <p className="font-medium">{selectedRequest.employee.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(selectedRequest.amount, true)} • {selectedRequest.expenseDate}
                  </p>
                  {selectedRequest.description && (
                    <p className="text-sm text-muted-foreground mt-2">{selectedRequest.description}</p>
                  )}
                </div>

                {actionType !== "paid" && (
                  <div className="space-y-2">
                    <Label htmlFor="reimb-review-notes">Catatan (opsional)</Label>
                    <Textarea
                      id="reimb-review-notes"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Tambahkan catatan untuk karyawan..."
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRequest(null);
                  setActionType(null);
                  setReviewNotes("");
                }}
              >
                Batal
              </Button>
              <Button
                onClick={confirmAction}
                disabled={updateStatusMutation.isPending}
                variant={actionType === "reject" ? "destructive" : "default"}
              >
                {updateStatusMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {actionType === "approve" ? "Setujui" : actionType === "reject" ? "Tolak" : "Tandai sudah dibayar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Reimbursements;
