import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Pencil, Trash2, Users, Loader2, ShieldAlert } from "lucide-react";
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment, Department } from "@/hooks/useDepartments";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

const Departments = () => {
  const { data: departments, isLoading } = useDepartments();
  const { can, isLoading: roleLoading } = usePermissions();
  const canView = can("employees", "view");
  const canManage = can("employees", "manage");
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", manager_id: "" });

  // Ambil karyawan untuk pemilihan kepala departemen
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-manager"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .eq("status", "active")
        .order("first_name");
      if (error) throw error;
      return data || [];
    },
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", manager_id: "" });
    setEditingDepartment(null);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Nama departemen wajib diisi");
      return;
    }

    try {
      await createDepartment.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        manager_id: formData.manager_id || null,
      });
      toast.success("Departemen berhasil dibuat");
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Gagal membuat departemen");
    }
  };

  const handleUpdate = async () => {
    if (!editingDepartment || !formData.name.trim()) {
      toast.error("Nama departemen wajib diisi");
      return;
    }

    try {
      await updateDepartment.mutateAsync({
        id: editingDepartment.id,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        manager_id: formData.manager_id || null,
      });
      toast.success("Departemen berhasil diperbarui");
      setEditingDepartment(null);
      resetForm();
    } catch (error) {
      toast.error("Gagal memperbarui departemen");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDepartment.mutateAsync(id);
      toast.success("Departemen berhasil dihapus");
    } catch (error) {
      toast.error("Gagal menghapus departemen. Mungkin masih ada karyawan yang ditugaskan di departemen ini.");
    }
  };

  const openEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || "",
      manager_id: department.manager_id || "",
    });
  };

  // Tampilkan pemuatan saat memeriksa peran
  if (roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Alihkan pengguna non-admin/HR
  if (!canView) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Akses ditolak</h1>
          <p className="text-muted-foreground">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          <p className="text-sm text-muted-foreground">Hanya administrator dan staf HR yang dapat mengelola departemen.</p>
        </div>
      </DashboardLayout>
    );
  }

  const managerSelect = (id: string) => (
    <Select
      value={formData.manager_id}
      onValueChange={(value) => setFormData({ ...formData, manager_id: value === "none" ? "" : value })}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder="Pilih kepala departemen" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Tanpa kepala departemen</SelectItem>
        {employees.map((emp) => (
          <SelectItem key={emp.id} value={emp.id}>
            {emp.first_name} {emp.last_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const formatCreated = (value: string | null | undefined) =>
    value && !isNaN(new Date(value).getTime()) ? format(new Date(value), "MMM d, yyyy") : "—";

  const deleteBlockedReason = (department: Department) =>
    department.employee_count > 0
      ? `Pindahkan ${department.employee_count} karyawannya ke departemen lain sebelum menghapus.`
      : null;

  const renderActions = (department: Department) => {
    const blocked = deleteBlockedReason(department);
    const deleteButton = (
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 sm:h-9 sm:w-9"
        aria-label={blocked ? `Hapus ${department.name} (tidak tersedia: ${blocked})` : `Hapus ${department.name}`}
        disabled={!!blocked}
        onClick={() => setDeletingDepartment(department)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    );
    return (
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 sm:h-9 sm:w-9"
          aria-label={`Sunting ${department.name}`}
          title="Sunting"
          onClick={() => openEdit(department)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        {blocked ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="inline-flex rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-delete-wrapper>
                {deleteButton}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-[220px]">{blocked}</TooltipContent>
          </Tooltip>
        ) : (
          deleteButton
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Departemen</h1>
            <p className="text-muted-foreground">Kelola departemen dan tim perusahaan</p>
          </div>
          {canManage && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} className="self-start sm:self-auto">
                <Plus className="mr-2 h-4 w-4" />
                Tambah departemen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat departemen</DialogTitle>
                <DialogDescription>Tambahkan departemen baru ke organisasi Anda</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama *</Label>
                  <Input
                    id="name"
                    placeholder="mis., Teknik"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    placeholder="Deskripsi singkat departemen"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager">Kepala departemen</Label>
                  {managerSelect("manager")}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleCreate} disabled={createDepartment.isPending}>
                  Buat
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )}
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="w-fit rounded-xl bg-primary/10 p-2.5 sm:p-3">
                  <Building2 className="h-5 w-5 text-primary sm:h-6 sm:w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total departemen</p>
                  <p className="text-2xl font-bold">{departments?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="w-fit rounded-xl bg-primary/10 p-2.5 sm:p-3">
                  <Users className="h-5 w-5 text-primary sm:h-6 sm:w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total karyawan</p>
                  <p className="text-2xl font-bold">
                    {departments?.reduce((sum, d) => sum + d.employee_count, 0) || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Departemen */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Semua departemen</CardTitle>
            <CardDescription>Lihat dan kelola semua departemen di organisasi Anda</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : departments && departments.length > 0 ? (
              <>
              <div className="hidden rounded-md border sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Kepala departemen</TableHead>
                      <TableHead>Karyawan</TableHead>
                      <TableHead>Dibuat</TableHead>
                      {canManage && <TableHead className="text-right">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((department) => (
                      <TableRow key={department.id} data-department-row>
                        <TableCell className="font-medium">{department.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {department.description || "—"}
                        </TableCell>
                        <TableCell>
                          {department.manager_name || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="tabular-nums">{department.employee_count}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatCreated(department.created_at)}</TableCell>
                        {canManage && (
                          <TableCell className="text-right">{renderActions(department)}</TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Kartu untuk tampilan mobile */}
              <ul className="space-y-3 sm:hidden">
                {departments.map((department) => (
                  <li key={department.id} data-department-row className="rounded-lg border p-3">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{department.name}</p>
                        {department.description && (
                          <p className="text-sm text-muted-foreground">{department.description}</p>
                        )}
                      </div>
                      {canManage && renderActions(department)}
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                      <dt className="text-muted-foreground">Kepala</dt>
                      <dd className="text-right">{department.manager_name || "—"}</dd>
                      <dt className="text-muted-foreground">Karyawan</dt>
                      <dd className="text-right tabular-nums">{department.employee_count}</dd>
                      <dt className="text-muted-foreground">Dibuat</dt>
                      <dd className="text-right">{formatCreated(department.created_at)}</dd>
                    </dl>
                    {canManage && deleteBlockedReason(department) && (
                      <p className="mt-2 text-xs text-muted-foreground">{deleteBlockedReason(department)}</p>
                    )}
                  </li>
                ))}
              </ul>
              </>
            ) : (
              <div className="flex h-32 items-center justify-center text-center text-muted-foreground">
                Tidak ada departemen ditemukan. Buat departemen pertama Anda untuk memulai.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog sunting */}
        <Dialog open={!!editingDepartment} onOpenChange={(open) => !open && setEditingDepartment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sunting departemen</DialogTitle>
              <DialogDescription>Perbarui detail departemen</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nama *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Deskripsi</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-manager">Kepala departemen</Label>
                {managerSelect("edit-manager")}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingDepartment(null)}>
                Batal
              </Button>
              <Button onClick={handleUpdate} disabled={updateDepartment.isPending}>
                Simpan perubahan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Konfirmasi penghapusan */}
        <AlertDialog open={!!deletingDepartment} onOpenChange={(open) => !open && setDeletingDepartment(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus departemen?</AlertDialogTitle>
              <AlertDialogDescription>
                Anda yakin ingin menghapus "{deletingDepartment?.name}"? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingDepartment && handleDelete(deletingDepartment.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default Departments;
