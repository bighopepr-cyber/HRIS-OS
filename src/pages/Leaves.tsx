import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LeaveRequestCard, LeaveRequest } from "@/components/leaves/LeaveRequestCard";
import { LeaveRequestForm } from "@/components/profile/LeaveRequestForm";
import { LeaveCalendarView } from "@/components/leaves/LeaveCalendarView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { pluralizeDays } from "@/lib/statusStyles";
import { Calendar, Plus, Clock, CheckCircle, XCircle, ArrowUpDown, Tag, Loader2 } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { useSorting } from "@/hooks/useSorting";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLeaveRequests, useLeaveStats } from "@/hooks/useLeaves";
import { usePermissions } from "@/hooks/usePermissions";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { drawPdfHeader, drawPdfFooter, fetchImageAsDataUrl, PDF_TABLE_HEAD_STYLE, PDF_COLORS } from "@/lib/pdfTheme";
import { DateRangeExportDialog } from "@/components/export/DateRangeExportDialog";
import { format, parseISO, isWithinInterval, isAfter, isBefore } from "date-fns";
const Leaves = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const { can, roles } = usePermissions();
  const { data: branding } = useCompanyBranding();

  // Status dialog persetujuan
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  // Filter tab yang telah diproses
  const [processedStatusFilter, setProcessedStatusFilter] = useState<"all" | "approved" | "rejected">("all");
  const [processedTypeFilter, setProcessedTypeFilter] = useState<string>("all");
  const [processedMonthFilter, setProcessedMonthFilter] = useState<string>("all");
  const [processedYearFilter, setProcessedYearFilter] = useState<string>("all");
  // Manajer menyetujui laporan timnya (RLS membatasi mereka pada timnya);
  // leaves:manage dapat menyetujui siapa pun
  const canApproveLeaves = can("leaves", "manage") || roles.includes("manager");
  const {
    data: myEmployeeId,
    isLoading: isLoadingMyEmployee
  } = useQuery({
    queryKey: ["my-employee-id", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const {
        data,
        error
      } = await supabase.from("employees").select("id").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
    enabled: !!user?.id
  });
  const {
    data: requests = [],
    isLoading
  } = useLeaveRequests();
  const {
    data: stats
  } = useLeaveStats();

  // Mutasi untuk memperbarui status cuti beserta catatannya
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      requestId,
      status,
      reviewNotes
    }: {
      requestId: string;
      status: "approved" | "rejected";
      reviewNotes: string;
    }) => {
      // Ambil data karyawan pengguna saat ini untuk reviewed_by
      const {
        data: employeeData
      } = await supabase.from("employees").select("id, first_name, last_name").eq("user_id", user?.id).maybeSingle();
      const {
        error
      } = await supabase.from("leave_requests").update({
        status,
        review_notes: reviewNotes.trim() || null,
        reviewed_by: employeeData?.id || null,
        reviewed_at: new Date().toISOString()
      }).eq("id", requestId);
      if (error) throw error;

      // Kirim notifikasi (fire and forget)
      const reviewerName = employeeData ? `${employeeData.first_name} ${employeeData.last_name}` : "Tim HR";
      supabase.functions.invoke("leave-status-notification", {
        body: {
          request_id: requestId,
          status,
          reviewer_name: reviewerName,
          review_notes: reviewNotes.trim() || undefined
        }
      }).catch(err => {
        console.error("Gagal mengirim notifikasi status cuti:", err);
      });
      return status;
    },
    onSuccess: status => {
      queryClient.invalidateQueries({
        queryKey: ["leave-requests"]
      });
      queryClient.invalidateQueries({
        queryKey: ["leave-stats"]
      });
      queryClient.invalidateQueries({
        queryKey: ["leave-balances"]
      });
      toast({
        title: status === "approved" ? "Cuti Disetujui" : "Cuti Ditolak",
        description: `Permintaan cuti telah ${status === "approved" ? "disetujui" : "ditolak"}.`
      });
      setSelectedRequest(null);
      setReviewNotes("");
      setActionType(null);
    },
    onError: error => {
      toast({
        title: "Kesalahan",
        description: `Gagal memperbarui permintaan cuti: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  const handleApprove = (id: string) => {
    const request = requests.find(r => r.id === id);
    if (request) {
      setSelectedRequest(request);
      setActionType("approve");
      setReviewNotes("");
    }
  };
  const handleReject = (id: string) => {
    const request = requests.find(r => r.id === id);
    if (request) {
      setSelectedRequest(request);
      setActionType("reject");
      setReviewNotes("");
    }
  };
  const confirmAction = () => {
    if (!selectedRequest || !actionType) return;
    updateStatusMutation.mutate({
      requestId: selectedRequest.id,
      status: actionType === "approve" ? "approved" : "rejected",
      reviewNotes
    });
  };
  const filterByDateRange = (items: LeaveRequest[], startDate?: Date, endDate?: Date) => {
    if (!startDate && !endDate) return items;
    return items.filter(req => {
      const leaveStartDate = parseISO(req.startDateISO ?? "");
      if (startDate && endDate) {
        return isWithinInterval(leaveStartDate, {
          start: startDate,
          end: endDate
        });
      }
      if (startDate) return isAfter(leaveStartDate, startDate) || leaveStartDate.getTime() === startDate.getTime();
      if (endDate) return isBefore(leaveStartDate, endDate) || leaveStartDate.getTime() === endDate.getTime();
      return true;
    });
  };
  const exportToCSV = (startDate?: Date, endDate?: Date) => {
    const allRequests = [...pendingRequests, ...processedRequests];
    const filteredRequests = filterByDateRange(allRequests, startDate, endDate);
    const headers = ["Karyawan", "Departemen", "Jenis", "Tanggal Mulai", "Tanggal Selesai", "Hari", "Status", "Alasan"];
    const csvContent = [headers.join(","), ...filteredRequests.map(req => [`"${req.employee.name}"`, `"${req.employee.department}"`, `"${req.type}"`, `"${req.startDateISO ?? req.startDate}"`, `"${req.endDateISO ?? req.endDate}"`, `"${req.days}"`, `"${req.status}"`, `"${req.reason || ''}"`].join(","))].join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const dateRange = startDate || endDate ? `-${startDate ? format(startDate, "yyyy-MM-dd") : "start"}-to-${endDate ? format(endDate, "yyyy-MM-dd") : "end"}` : "";
    link.download = `leave-requests${dateRange}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast({
      title: "Ekspor Selesai",
      description: `${filteredRequests.length} permintaan cuti diekspor ke CSV`
    });
  };
  const exportToPDF = async (startDate?: Date, endDate?: Date) => {
    const allRequests = [...pendingRequests, ...processedRequests];
    const filteredRequests = filterByDateRange(allRequests, startDate, endDate);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const logoDataUrl = await fetchImageAsDataUrl(branding?.logoUrl);

    const subtitle = startDate || endDate
      ? `Rentang Tanggal: ${startDate ? format(startDate, "PP") : "Awal"} - ${endDate ? format(endDate, "PP") : "Akhir"}`
      : undefined;

    let currentY = drawPdfHeader(doc, {
      title: "Laporan Permintaan Cuti",
      subtitle,
      companyName: branding?.companyName,
      companyAddress: branding?.companyAddress,
      logoDataUrl,
      pageWidth,
      margin,
    });

    doc.setTextColor(...PDF_COLORS.dark);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (startDate || endDate) {
      doc.text(`Total Permintaan: ${filteredRequests.length}`, margin, currentY);
    } else {
      doc.text(`Total Permintaan: ${filteredRequests.length} | Tertunda: ${pendingRequests.length} | Diproses: ${processedRequests.length}`, margin, currentY);
    }
    currentY += 10;

    autoTable(doc, {
      startY: currentY,
      head: [["Karyawan", "Departemen", "Jenis", "Tanggal Mulai", "Tanggal Selesai", "Hari", "Status"]],
      body: filteredRequests.map(req => [req.employee.name, req.employee.department, req.type, req.startDate, req.endDate, req.days.toString(), req.status]),
      styles: {
        fontSize: 8
      },
      headStyles: PDF_TABLE_HEAD_STYLE
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      drawPdfFooter(doc, { pageWidth, pageHeight, margin, pageNumber: i, totalPages: pageCount });
    }

    const dateRange = startDate || endDate ? `-${startDate ? format(startDate, "yyyy-MM-dd") : "start"}-to-${endDate ? format(endDate, "yyyy-MM-dd") : "end"}` : "";
    doc.save(`leave-requests${dateRange}-${new Date().toISOString().split("T")[0]}.pdf`);
    toast({
      title: "Ekspor Selesai",
      description: `${filteredRequests.length} permintaan cuti diekspor ke PDF`
    });
  };
  const pendingRequests = requests.filter(r => r.status === "pending");
  const allProcessedRequests = requests.filter(r => r.status !== "pending");

  // Ambil jenis cuti unik untuk filter
  const uniqueLeaveTypes = [...new Set(allProcessedRequests.map(r => r.type))];

  // Ambil tahun unik untuk filter
  const uniqueYears = [...new Set(allProcessedRequests.map(r => parseISO(r.startDateISO ?? "").getFullYear()).filter(y => !Number.isNaN(y)))].sort((a, b) => b - a);
  const MONTHS = [{
    value: "0",
    label: "Januari"
  }, {
    value: "1",
    label: "Februari"
  }, {
    value: "2",
    label: "Maret"
  }, {
    value: "3",
    label: "April"
  }, {
    value: "4",
    label: "Mei"
  }, {
    value: "5",
    label: "Juni"
  }, {
    value: "6",
    label: "Juli"
  }, {
    value: "7",
    label: "Agustus"
  }, {
    value: "8",
    label: "September"
  }, {
    value: "9",
    label: "Oktober"
  }, {
    value: "10",
    label: "November"
  }, {
    value: "11",
    label: "Desember"
  }];

  // Terapkan filter pada permintaan yang telah diproses
  const processedRequests = allProcessedRequests.filter(r => {
    const statusMatch = processedStatusFilter === "all" || r.status === processedStatusFilter;
    const typeMatch = processedTypeFilter === "all" || r.type === processedTypeFilter;
    const leaveDate = parseISO(r.startDateISO ?? "");
    const monthMatch = processedMonthFilter === "all" || leaveDate.getMonth().toString() === processedMonthFilter;
    const yearMatch = processedYearFilter === "all" || leaveDate.getFullYear().toString() === processedYearFilter;
    return statusMatch && typeMatch && monthMatch && yearMatch;
  });

  // Pengurutan untuk permintaan tertunda
  const pendingSorting = useSorting<LeaveRequest>(pendingRequests, "startDateISO", "asc");
  // Pengurutan untuk permintaan yang telah diproses
  const processedSorting = useSorting<LeaveRequest>(processedRequests, "startDateISO", "desc");
  const pendingPagination = usePagination(pendingSorting.sortedItems, {
    initialPageSize: 10
  });
  const processedPagination = usePagination(processedSorting.sortedItems, {
    initialPageSize: 10
  });
  const leaveStats = [{
    label: "Tertunda",
    value: stats?.pending || 0,
    icon: <Clock className="h-5 w-5" />,
    color: "text-amber-600"
  }, {
    label: "Disetujui",
    value: stats?.approved || 0,
    icon: <CheckCircle className="h-5 w-5" />,
    color: "text-emerald-600"
  }, {
    label: "Ditolak",
    value: stats?.rejected || 0,
    icon: <XCircle className="h-5 w-5" />,
    color: "text-destructive"
  }];
  const sortOptions = [{
    key: "startDateISO",
    label: "Tanggal",
    icon: Calendar
  }, {
    key: "days",
    label: "Durasi",
    icon: Clock
  }, {
    key: "type",
    label: "Jenis",
    icon: Tag
  }] as const;
  const renderSortDropdown = (sorting: ReturnType<typeof useSorting<LeaveRequest>>) => <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 gap-2">
          <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
          Urutkan: {sorting.sortConfig.key ? sortOptions.find(o => o.key === sorting.sortConfig.key)?.label : "Bawaan"}
          {sorting.sortConfig.direction && <span aria-label={sorting.sortConfig.direction === "asc" ? "menaik" : "menurun"}>{sorting.sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {sortOptions.map(option => {
        const Icon = option.icon;
        return <DropdownMenuItem key={option.key} onClick={() => sorting.requestSort(option.key as keyof LeaveRequest)} className={sorting.sortConfig.key === option.key ? "bg-accent" : ""}>
              <Icon className="mr-2 h-4 w-4" />
              {option.label}
              {sorting.sortConfig.key === option.key && <span className="ml-2">{sorting.sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
            </DropdownMenuItem>;
      })}
      </DropdownMenuContent>
    </DropdownMenu>;
  const renderPaginationControls = (pagination: ReturnType<typeof usePagination>) => {
    if (pagination.totalPages <= 1) return null;
    const getPageNumbers = () => {
      const pages: (number | "ellipsis")[] = [];
      const {
        currentPage,
        totalPages
      } = pagination;
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        if (currentPage > 3) pages.push("ellipsis");
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
          pages.push(i);
        }
        if (currentPage < totalPages - 2) pages.push("ellipsis");
        pages.push(totalPages);
      }
      return pages;
    };
    return <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Tampilkan</span>
          <Select value={pagination.pageSize.toString()} onValueChange={v => pagination.setPageSize(Number(v))}>
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map(size => <SelectItem key={size} value={size.toString()}>{size}</SelectItem>)}
            </SelectContent>
          </Select>
          <span>dari {pagination.totalItems} permintaan</span>
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => pagination.canGoPrevious && pagination.goToPreviousPage()} className={!pagination.canGoPrevious ? "pointer-events-none opacity-50" : "cursor-pointer"} />
            </PaginationItem>
            {getPageNumbers().map((page, idx) => page === "ellipsis" ? <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem> : <PaginationItem key={page}>
                  <PaginationLink onClick={() => pagination.setPage(page)} isActive={pagination.currentPage === page} className="cursor-pointer">
                    {page}
                  </PaginationLink>
                </PaginationItem>)}
            <PaginationItem>
              <PaginationNext onClick={() => pagination.canGoNext && pagination.goToNextPage()} className={!pagination.canGoNext ? "pointer-events-none opacity-50" : "cursor-pointer"} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>;
  };
  return <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Cuti</h1>
            <p className="text-muted-foreground">Kelola dan lacak permintaan cuti</p>
          </div>
          <div className="flex gap-2">
            <DateRangeExportDialog title="Ekspor permintaan cuti" description="Ekspor permintaan cuti dengan filter rentang tanggal opsional berdasarkan tanggal mulai cuti." onExportCSV={exportToCSV} onExportPDF={exportToPDF} triggerClassName="flex-1 sm:flex-none" />
            <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none">
                  <Plus className="mr-2 h-4 w-4" />
                  Permintaan baru
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Permintaan cuti baru</DialogTitle>
                  <DialogDescription>Kirim permintaan cuti untuk persetujuan.</DialogDescription>
                </DialogHeader>

                {isLoadingMyEmployee ? <Skeleton className="h-72 w-full" /> : !myEmployeeId ? <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Kami tidak menemukan profil karyawan yang terhubung dengan akun Anda. Silakan hubungi HR untuk menautkan profil Anda.
                  </div> : <LeaveRequestForm employeeId={myEmployeeId} variant="dialog" onCancel={() => setIsNewRequestOpen(false)} onSubmitted={() => setIsNewRequestOpen(false)} />}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {leaveStats.map(stat => <Card key={stat.label}>
              <CardContent className="flex flex-col items-start gap-2 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-6">
                <div className={`shrink-0 rounded-xl bg-muted p-2 sm:p-3 ${stat.color}`}>
                  {stat.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-foreground sm:text-2xl">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>)}
        </div>

        {/* Permintaan Cuti */}
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Tertunda
              <Badge variant="secondary" className="ml-2">
                {pendingRequests.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="processed">Diproses</TabsTrigger>
            <TabsTrigger value="calendar">Kalender</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6 space-y-4">
            {isLoading ? <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
              </div> : pendingRequests.length === 0 ? <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">Tidak ada permintaan tertunda</h3>
                  <p className="text-muted-foreground">Semua permintaan cuti telah diproses</p>
                </CardContent>
              </Card> : <>
                <div className="flex justify-end">
                  {renderSortDropdown(pendingSorting)}
                </div>
                {pendingPagination.paginatedItems.map(request => {
                  // Tidak dapat menyetujui permintaan cuti sendiri
                  const isOwnRequest = myEmployeeId && request.employeeId === myEmployeeId;
                  const canApproveThisRequest = canApproveLeaves && !isOwnRequest;
                  return (
                    <LeaveRequestCard 
                      key={request.id} 
                      request={request} 
                      onApprove={canApproveThisRequest ? handleApprove : undefined} 
                      onReject={canApproveThisRequest ? handleReject : undefined} 
                    />
                  );
                })}
                {renderPaginationControls(pendingPagination)}
              </>}
          </TabsContent>

          <TabsContent value="processed" className="mt-6 space-y-4">
            {isLoading ? <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
              </div> : allProcessedRequests.length === 0 ? <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">Tidak ada permintaan yang diproses</h3>
                  <p className="text-muted-foreground">Permintaan cuti yang telah diproses akan muncul di sini</p>
                </CardContent>
              </Card> : <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
                    <Select value={processedMonthFilter} onValueChange={setProcessedMonthFilter}>
                      <SelectTrigger className="sm:w-[140px]" aria-label="Filter berdasarkan bulan">
                        <SelectValue placeholder="Bulan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua bulan</SelectItem>
                        {MONTHS.map(month => <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={processedYearFilter} onValueChange={setProcessedYearFilter}>
                      <SelectTrigger className="sm:w-[120px]" aria-label="Filter berdasarkan tahun">
                        <SelectValue placeholder="Tahun" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua tahun</SelectItem>
                        {uniqueYears.map(year => <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={processedStatusFilter} onValueChange={v => setProcessedStatusFilter(v as "all" | "approved" | "rejected")}>
                      <SelectTrigger className="sm:w-[130px]" aria-label="Filter berdasarkan status">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua status</SelectItem>
                        <SelectItem value="approved">Disetujui</SelectItem>
                        <SelectItem value="rejected">Ditolak</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={processedTypeFilter} onValueChange={setProcessedTypeFilter}>
                      <SelectTrigger className="sm:w-[160px]" aria-label="Filter berdasarkan jenis cuti">
                        <SelectValue placeholder="Jenis Cuti" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua jenis</SelectItem>
                        {uniqueLeaveTypes.map(type => <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                    {(processedStatusFilter !== "all" || processedTypeFilter !== "all" || processedMonthFilter !== "all" || processedYearFilter !== "all") && <Button variant="ghost" size="sm" onClick={() => {
                  setProcessedStatusFilter("all");
                  setProcessedTypeFilter("all");
                  setProcessedMonthFilter("all");
                  setProcessedYearFilter("all");
                }}>
                        Hapus filter
                      </Button>}
                  </div>
                  {renderSortDropdown(processedSorting)}
                </div>
                {processedRequests.length === 0 ? <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-semibold text-foreground">Tidak ada permintaan yang cocok</h3>
                      <p className="text-muted-foreground">Coba ubah filter Anda</p>
                    </CardContent>
                  </Card> : <>
                    {processedPagination.paginatedItems.map(request => <LeaveRequestCard key={request.id} request={request} />)}
                    {renderPaginationControls(processedPagination)}
                  </>}
              </>}
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <LeaveCalendarView />
          </TabsContent>
        </Tabs>

        {/* Dialog Konfirmasi Persetujuan */}
        <Dialog open={!!selectedRequest && !!actionType} onOpenChange={open => {
        if (!open) {
          setSelectedRequest(null);
          setActionType(null);
          setReviewNotes("");
        }
      }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "approve" ? "Setujui permintaan cuti" : "Tolak permintaan cuti"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve" ? "Anda yakin ingin menyetujui permintaan cuti ini?" : "Anda yakin ingin menolak permintaan cuti ini?"}
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && <div className="space-y-4">
                <div className="space-y-1.5 rounded-lg border bg-muted/50 p-4">
                  <p className="font-medium">{selectedRequest.employee.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.type} • {pluralizeDays(selectedRequest.days)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.startDate === selectedRequest.endDate ? selectedRequest.startDate : `${selectedRequest.startDate} – ${selectedRequest.endDate}`}
                  </p>
                  {selectedRequest.reason && <p className="text-sm text-muted-foreground mt-2">
                      <span className="font-medium">Alasan:</span> {selectedRequest.reason}
                    </p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leave-review-notes">Catatan (opsional)</Label>
                  <Textarea id="leave-review-notes" value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder="Tambahkan catatan untuk karyawan..." rows={3} />
                </div>
              </div>}

            <DialogFooter>
              <Button variant="outline" onClick={() => {
              setSelectedRequest(null);
              setActionType(null);
              setReviewNotes("");
            }}>
                Batal
              </Button>
              <Button onClick={confirmAction} disabled={updateStatusMutation.isPending} variant={actionType === "approve" ? "default" : "destructive"}>
                {updateStatusMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {actionType === "approve" ? "Setujui" : "Tolak"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>;
};
export default Leaves;