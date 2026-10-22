import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AssetCard } from "@/components/assets/AssetCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Package, Laptop, Monitor, Smartphone, Headphones, ArrowUpDown, ShieldAlert } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { usePermissions } from "@/hooks/usePermissions";
import { useSorting } from "@/hooks/useSorting";
import { DropdownMenu as SortDropdownMenu, DropdownMenuContent as SortDropdownMenuContent, DropdownMenuItem as SortDropdownMenuItem, DropdownMenuTrigger as SortDropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useAssets, useAssetStats, useCreateAsset, useUpdateAsset, useDeleteAsset, useAssignAsset, useReturnAsset, useAssetHistory, ASSET_TYPES, type Asset, type AssetType } from "@/hooks/useAssets";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEmployees } from "@/hooks/useEmployees";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DateRangeExportDialog } from "@/components/export/DateRangeExportDialog";
import { format, parseISO, isWithinInterval, isAfter, isBefore } from "date-fns";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { statusBadgeClass, formatStatus } from "@/lib/statusStyles";
import { drawPdfHeader, drawPdfFooter, fetchImageAsDataUrl, PDF_TABLE_HEAD_STYLE, PDF_COLORS } from "@/lib/pdfTheme";
const ASSET_TYPE_LABELS: Record<AssetType, { singular: string; plural: string }> = {
  laptop: { singular: "Laptop", plural: "Laptop" },
  desktop: { singular: "Desktop", plural: "Desktop" },
  monitor: { singular: "Monitor", plural: "Monitor" },
  phone: { singular: "Ponsel", plural: "Ponsel" },
  tablet: { singular: "Tablet", plural: "Tablet" },
  accessory: { singular: "Aksesori", plural: "Aksesori" },
  other: { singular: "Lainnya", plural: "Lainnya" },
};
const ASSET_STATUSES = ["available", "assigned", "maintenance", "retired"] as const;
const EMPTY_FORM = {
  name: "",
  category: "laptop",
  serial_number: "",
  purchase_date: "",
  purchase_cost: "",
  vendor: "",
  notes: ""
};
type AssetFormData = typeof EMPTY_FORM;

const Assets = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [historyAssetId, setHistoryAssetId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [formData, setFormData] = useState<AssetFormData>(EMPTY_FORM);
  const {
    data: assets = [],
    isLoading
  } = useAssets();
  const {
    data: stats
  } = useAssetStats();
  const {
    data: employees = []
  } = useEmployees();
  const { can } = usePermissions();
  const canViewAssets = can("assets", "view");
  const canManageAssets = can("assets", "manage");
  const { data: branding } = useCompanyBranding();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const assignAsset = useAssignAsset();
  const returnAsset = useReturnAsset();
  const {
    data: assetHistory = [],
    isLoading: isHistoryLoading
  } = useAssetHistory(historyAssetId);
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || asset.type === typeFilter;
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Terapkan pengurutan
  const {
    sortedItems: sortedAssets,
    sortConfig,
    requestSort
  } = useSorting(filteredAssets);
  const sortOptions = [{
    key: "name",
    label: "Nama"
  }, {
    key: "type",
    label: "Jenis"
  }, {
    key: "status",
    label: "Status"
  }, {
    key: "cost",
    label: "Biaya"
  }] as const;
  const {
    paginatedItems: paginatedAssets,
    currentPage,
    totalPages,
    totalItems,
    setPage,
    setPageSize,
    pageSize,
    goToNextPage,
    goToPreviousPage,
    canGoNext,
    canGoPrevious
  } = usePagination(sortedAssets, {
    initialPageSize: 12
  });
  const filterByDateRange = (items: Asset[], startDate?: Date, endDate?: Date) => {
    if (!startDate && !endDate) return items;
    return items.filter(asset => {
      const purchaseDate = asset.purchaseDate ? parseISO(asset.purchaseDate) : null;
      if (!purchaseDate) return !startDate && !endDate;
      if (startDate && endDate) {
        return isWithinInterval(purchaseDate, {
          start: startDate,
          end: endDate
        });
      }
      if (startDate) return isAfter(purchaseDate, startDate) || purchaseDate.getTime() === startDate.getTime();
      if (endDate) return isBefore(purchaseDate, endDate) || purchaseDate.getTime() === endDate.getTime();
      return true;
    });
  };
  const exportToCSV = (startDate?: Date, endDate?: Date) => {
    const dataToExport = filterByDateRange(sortedAssets, startDate, endDate);
    const headers = ["Nama", "Kategori", "Nomor Seri", "Status", "Biaya", "Tanggal Pembelian", "Diberikan Kepada"];
    const csvContent = [headers.join(","), ...dataToExport.map(asset => [`"${asset.name}"`, `"${asset.type}"`, `"${asset.serialNumber}"`, `"${asset.status}"`, `"${asset.cost}"`, `"${asset.purchaseDate || ''}"`, `"${asset.assignedTo?.name || 'Belum diberikan'}"`].join(","))].join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const dateRange = startDate || endDate ? `-${startDate ? format(startDate, "yyyy-MM-dd") : "start"}-to-${endDate ? format(endDate, "yyyy-MM-dd") : "end"}` : "";
    link.download = `assets${dateRange}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success(`${dataToExport.length} aset diekspor ke CSV`);
  };
  const exportToPDF = async (startDate?: Date, endDate?: Date) => {
    const dataToExport = filterByDateRange(sortedAssets, startDate, endDate);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const logoDataUrl = await fetchImageAsDataUrl(branding?.logoUrl);

    const subtitle = startDate || endDate
      ? `Rentang Tanggal: ${startDate ? format(startDate, "PP") : "Awal"} - ${endDate ? format(endDate, "PP") : "Akhir"}`
      : undefined;

    let currentY = drawPdfHeader(doc, {
      title: "Inventaris Aset",
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
    doc.text(`Total Aset: ${dataToExport.length}`, margin, currentY);
    currentY += 10;

    autoTable(doc, {
      startY: currentY,
      head: [["Nama", "Kategori", "Nomor Seri", "Status", "Biaya", "Diberikan Kepada"]],
      body: dataToExport.map(asset => [asset.name, asset.type, asset.serialNumber, asset.status, `Rs. ${asset.cost.toLocaleString()}`, asset.assignedTo?.name || "Belum diberikan"]),
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
    doc.save(`assets${dateRange}-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success(`${dataToExport.length} aset diekspor ke PDF`);
  };
  const handleAddAsset = () => {
    if (!formData.name.trim()) {
      toast.error("Nama aset wajib diisi");
      return;
    }
    createAsset.mutate({
      name: formData.name,
      category: formData.category,
      serial_number: formData.serial_number || undefined,
      purchase_date: formData.purchase_date || undefined,
      purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : undefined,
      vendor: formData.vendor || undefined,
      notes: formData.notes || undefined
    }, {
      onSuccess: () => {
        toast.success("Aset berhasil ditambahkan");
        setIsAddDialogOpen(false);
        setFormData(EMPTY_FORM);
      },
      onError: () => {
        toast.error("Gagal menambahkan aset");
      }
    });
  };
  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormData({
      name: asset.name,
      // Pertahankan kategori khusus apa adanya alih-alih mengganti namanya secara diam-diam.
      category: asset.type === "other" ? asset.category : asset.type,
      serial_number: asset.serialNumber,
      purchase_date: asset.purchaseDateRaw,
      purchase_cost: asset.cost ? asset.cost.toString() : "",
      vendor: asset.vendor,
      notes: asset.notes || ""
    });
    setIsEditDialogOpen(true);
  };
  const handleUpdateAsset = () => {
    if (!selectedAsset || !formData.name.trim()) {
      toast.error("Nama aset wajib diisi");
      return;
    }
    updateAsset.mutate({
      id: selectedAsset.id,
      name: formData.name,
      category: formData.category,
      // Kirim setiap kolom (null saat dikosongkan) agar catatan yang tersimpan sesuai dengan formulir.
      serial_number: formData.serial_number.trim() || null,
      purchase_date: formData.purchase_date || null,
      purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
      vendor: formData.vendor.trim() || null,
      notes: formData.notes.trim() || null
    }, {
      onSuccess: () => {
        toast.success("Aset berhasil diperbarui");
        setIsEditDialogOpen(false);
        setSelectedAsset(null);
      },
      onError: () => {
        toast.error("Gagal memperbarui aset");
      }
    });
  };
  const handleDeleteAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDeleteDialogOpen(true);
  };
  const confirmDelete = () => {
    if (!selectedAsset) return;
    deleteAsset.mutate(selectedAsset.id, {
      onSuccess: () => {
        toast.success("Aset berhasil dihapus");
        setIsDeleteDialogOpen(false);
        setSelectedAsset(null);
      },
      onError: () => {
        toast.error("Gagal menghapus aset");
      }
    });
  };
  const handleAssignAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setSelectedEmployeeId("");
    setAssignmentNotes("");
    setIsAssignDialogOpen(true);
  };
  const confirmAssign = () => {
    if (!selectedAsset || !selectedEmployeeId) {
      toast.error("Silakan pilih karyawan");
      return;
    }
    assignAsset.mutate({
      assetId: selectedAsset.id,
      employeeId: selectedEmployeeId,
      notes: assignmentNotes || undefined
    }, {
      onSuccess: () => {
        toast.success("Aset berhasil ditugaskan");
        setIsAssignDialogOpen(false);
        setSelectedAsset(null);
        setSelectedEmployeeId("");
        setAssignmentNotes("");
      },
      onError: () => {
        toast.error("Gagal menugaskan aset");
      }
    });
  };
  const handleReturnAsset = (asset: Asset) => {
    returnAsset.mutate(asset.id, {
      onSuccess: () => {
        toast.success("Aset ditandai telah dikembalikan");
      },
      onError: () => {
        toast.error("Gagal mengembalikan aset");
      }
    });
  };
  const handleViewHistory = (asset: Asset) => {
    setSelectedAsset(asset);
    setHistoryAssetId(asset.id);
    setIsHistoryDialogOpen(true);
  };
  // Empat kelompok tipe ini selalu berjumlah sama dengan total.
  const assetStats = [{
    label: "Total aset",
    value: stats?.total || 0,
    icon: <Package className="h-5 w-5" aria-hidden="true" />
  }, {
    label: "Laptop & desktop",
    value: stats?.computers || 0,
    icon: <Laptop className="h-5 w-5" aria-hidden="true" />
  }, {
    label: "Monitor",
    value: stats?.monitors || 0,
    icon: <Monitor className="h-5 w-5" aria-hidden="true" />
  }, {
    label: "Ponsel & tablet",
    value: stats?.mobile || 0,
    icon: <Smartphone className="h-5 w-5" aria-hidden="true" />
  }, {
    label: "Aksesori & lainnya",
    value: stats?.other || 0,
    icon: <Headphones className="h-5 w-5" aria-hidden="true" />
  }];
  const categoryOptions: { value: string; label: string }[] = ASSET_TYPES.filter(t => t !== "other").map(t => ({
    value: t,
    label: ASSET_TYPE_LABELS[t].singular
  }));
  if (formData.category && !categoryOptions.some(o => o.value === formData.category)) {
    categoryOptions.push({ value: formData.category, label: formData.category });
  }
  const updateField = (field: keyof AssetFormData) => (value: string) => setFormData(prev => ({
    ...prev,
    [field]: value
  }));
  const renderAssetFields = (idPrefix: string) => <div className="space-y-4 py-2 sm:py-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}name`}>Nama aset *</Label>
        <Input id={`${idPrefix}name`} value={formData.name} onChange={e => updateField("name")(e.target.value)} placeholder="mis., MacBook Pro 16" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}category`}>Kategori</Label>
        <Select value={formData.category} onValueChange={updateField("category")}>
          <SelectTrigger id={`${idPrefix}category`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}serial_number`}>Nomor seri</Label>
        <Input id={`${idPrefix}serial_number`} value={formData.serial_number} onChange={e => updateField("serial_number")(e.target.value)} placeholder="mis., ABC123XYZ" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label htmlFor={`${idPrefix}purchase_date`}>Tanggal pembelian</Label>
          <Input id={`${idPrefix}purchase_date`} type="date" className="block w-full min-w-0" value={formData.purchase_date} onChange={e => updateField("purchase_date")(e.target.value)} />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor={`${idPrefix}purchase_cost`}>Biaya (₹)</Label>
          <Input id={`${idPrefix}purchase_cost`} type="number" inputMode="decimal" min="0" value={formData.purchase_cost} onChange={e => updateField("purchase_cost")(e.target.value)} placeholder="0.00" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}vendor`}>Vendor</Label>
        <Input id={`${idPrefix}vendor`} value={formData.vendor} onChange={e => updateField("vendor")(e.target.value)} placeholder="mis., Apple Store" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}notes`}>Catatan</Label>
        <Textarea id={`${idPrefix}notes`} value={formData.notes} onChange={e => updateField("notes")(e.target.value)} placeholder="mis., RAM 16GB, SSD 512GB, cip M3 Pro" rows={3} />
      </div>
    </div>;
  if (!canViewAssets) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-destructive" />
          <h2 className="text-2xl font-bold text-foreground">Akses Ditolak</h2>
          <p className="text-muted-foreground">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          <p className="text-sm text-muted-foreground">Mintalah akses administrator untuk modul Aset.</p>
        </div>
      </DashboardLayout>
    );
  }

  return <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Aset</h1>
            <p className="text-muted-foreground">Lacak dan kelola aset perusahaan</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <DateRangeExportDialog title="Ekspor Aset" description="Ekspor inventaris aset dengan filter rentang tanggal opsional berdasarkan tanggal pembelian." onExportCSV={exportToCSV} onExportPDF={exportToPDF} />
            {canManageAssets && <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Tambah aset
              </Button>}
          </div>
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {assetStats.map((stat, i) => <Card key={stat.label} className={i === 0 ? "col-span-2 lg:col-span-1" : undefined}>
              <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
                <div className="shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary sm:p-3">{stat.icon}</div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-foreground sm:text-2xl">{stat.value}</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
                </div>
              </CardContent>
            </Card>)}
        </div>

        {/* Filter */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari aset..." aria-label="Cari aset" className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[150px]" aria-label="Filter berdasarkan jenis">
              <SelectValue placeholder="Jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua jenis</SelectItem>
              {ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{ASSET_TYPE_LABELS[t].plural}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]" aria-label="Filter berdasarkan status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              {ASSET_STATUSES.map(st => <SelectItem key={st} value={st}>{formatStatus(st)}</SelectItem>)}
            </SelectContent>
          </Select>
          <SortDropdownMenu>
            <SortDropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full gap-2 sm:w-auto">
                <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                Urutkan: {sortConfig.key ? sortOptions.find(o => o.key === sortConfig.key)?.label : "Tidak ada"}
                {sortConfig.direction && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
              </Button>
            </SortDropdownMenuTrigger>
            <SortDropdownMenuContent align="end">
              {sortOptions.map(option => <SortDropdownMenuItem key={option.key} onClick={() => requestSort(option.key as keyof Asset)} className={sortConfig.key === option.key ? "bg-accent" : ""}>
                  {option.label}
                  {sortConfig.key === option.key && <span className="ml-2">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                </SortDropdownMenuItem>)}
            </SortDropdownMenuContent>
          </SortDropdownMenu>
        </div>

        {/* Grid Aset */}
        {isLoading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div> : filteredAssets.length === 0 ? <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Tidak ada aset ditemukan</h3>
              <p className="text-muted-foreground">
                {assets.length === 0 ? "Mulai dengan menambahkan aset pertama Anda" : "Tidak ada aset yang cocok dengan kriteria pencarian Anda"}
              </p>
              {assets.length === 0 && canManageAssets && <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Tambah aset
                </Button>}
            </CardContent>
          </Card> : <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedAssets.map(asset => <AssetCard key={asset.id} asset={asset} onEdit={handleEditAsset} onDelete={handleDeleteAsset} onAssign={handleAssignAsset} onReturn={handleReturnAsset} onViewHistory={handleViewHistory} showAdminActions={canManageAssets} />)}
            </div>
            
            {/* Kontrol paginasi */}
            {totalPages > 1 && <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Tampilkan</span>
                  <Select value={pageSize.toString()} onValueChange={v => setPageSize(Number(v))}>
                    <SelectTrigger className="h-8 w-[70px]" aria-label="Aset per halaman">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[6, 12, 24, 48].map(size => <SelectItem key={size} value={size.toString()}>{size}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <span>dari {totalItems} aset</span>
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => canGoPrevious && goToPreviousPage()} className={!canGoPrevious ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                    </PaginationItem>
                    {(() => {
                const pages: (number | "ellipsis")[] = [];
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
                return pages.map((page, idx) => page === "ellipsis" ? <PaginationItem key={`ellipsis-${idx}`}>
                            <PaginationEllipsis />
                          </PaginationItem> : <PaginationItem key={page}>
                            <PaginationLink onClick={() => setPage(page)} isActive={currentPage === page} className="cursor-pointer">
                              {page}
                            </PaginationLink>
                          </PaginationItem>);
              })()}
                    <PaginationItem>
                      <PaginationNext onClick={() => canGoNext && goToNextPage()} className={!canGoNext ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>}
          </>}
      </div>

      {/* Dialog Tambah Aset */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah aset baru</DialogTitle>
            <DialogDescription>Masukkan detail aset untuk menambahkannya ke inventaris.</DialogDescription>
          </DialogHeader>
          {renderAssetFields("")}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddAsset} disabled={createAsset.isPending}>
              {createAsset.isPending ? "Menambahkan..." : "Tambah aset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Sunting Aset */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sunting aset</DialogTitle>
            <DialogDescription>Perbarui detail aset di bawah ini.</DialogDescription>
          </DialogHeader>
          {renderAssetFields("edit-")}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateAsset} disabled={updateAsset.isPending}>
              {updateAsset.isPending ? "Menyimpan..." : "Simpan perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Penghapusan */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus aset</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus "{selectedAsset?.name}"? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteAsset.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Penetapan Aset */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tugaskan aset</DialogTitle>
            <DialogDescription>
              Tugaskan "{selectedAsset?.name}" kepada seorang karyawan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Pilih Karyawan *</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Pilih karyawan" />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter(emp => emp.status === "active").map(emp => <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} - {emp.department}
                      </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign-notes">Catatan (opsional)</Label>
              <Textarea id="assign-notes" value={assignmentNotes} onChange={e => setAssignmentNotes(e.target.value)} placeholder="mis., Ditugaskan untuk pekerjaan proyek" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={confirmAssign} disabled={assignAsset.isPending || !selectedEmployeeId}>
              {assignAsset.isPending ? "Menugaskan..." : "Tugaskan aset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Riwayat Penetapan */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={open => {
      setIsHistoryDialogOpen(open);
      if (!open) {
        setHistoryAssetId(null);
        setSelectedAsset(null);
      }
    }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Riwayat penetapan</DialogTitle>
            <DialogDescription>
              Riwayat untuk "{selectedAsset?.name}"
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {isHistoryLoading ? <div className="space-y-3 p-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
              </div> : assetHistory.length === 0 ? <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">Tidak ada riwayat penetapan ditemukan</p>
              </div> : <div className="space-y-3 p-1">
                {assetHistory.map((assignment, index) => <div key={assignment.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={assignment.employee.avatar} />
                          <AvatarFallback>
                            {assignment.employee.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{assignment.employee.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.assignedDate} — {assignment.returnedDate || "Sekarang"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={statusBadgeClass(index === 0 && !assignment.returnedDate ? "assigned" : "inactive")}>
                        {index === 0 && !assignment.returnedDate ? "Saat ini" : "Dikembalikan"}
                      </Badge>
                    </div>
                    {assignment.notes && <p className="mt-2 text-sm text-muted-foreground">{assignment.notes}</p>}
                  </div>)}
              </div>}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>;
};
export default Assets;