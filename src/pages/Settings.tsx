import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Building2, CalendarDays, Plus, Pencil, Trash2, Loader2, ShieldAlert, Users, Hash, Globe, MapPin, Palette, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDepartments } from "@/hooks/useEmployees";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { canAccessSettings } from "@/lib/permissions";
import { UserRolesManager } from "@/components/settings/UserRolesManager";
import { RolePermissionsMatrix } from "@/components/settings/RolePermissionsMatrix";
import { EmployeeCodeSettings } from "@/components/settings/EmployeeCodeSettings";
import DomainWhitelistSettings from "@/components/settings/DomainWhitelistSettings";
import OfficeLocationSettings from "@/components/settings/OfficeLocationSettings";
import { BrandingSettings } from "@/components/settings/BrandingSettings";
import { PayrollSettings } from "@/components/settings/PayrollSettings";
import { toneClass } from "@/lib/statusStyles";

// Ambil jenis cuti
const useLeaveTypes = () => {
  return useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });
};

interface DepartmentForm {
  name: string;
  description: string;
}

interface LeaveTypeForm {
  name: string;
  description: string;
  days_per_year: number;
  is_paid: boolean;
}

type SettingsTab =
  | "user-roles"
  | "departments"
  | "leave-types"
  | "employee-id"
  | "domain-whitelist"
  | "office-location"
  | "branding"
  | "payroll";

const Settings = () => {
  const [requestedTab, setRequestedTab] = useState<SettingsTab | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const perms = usePermissions();
  const { can, isAdmin, isLoading: roleLoading } = perms;

  const tabAllowed: Record<SettingsTab, boolean> = {
    "user-roles": isAdmin,
    departments: can('employees', 'manage'),
    "leave-types": can('leaves', 'manage'),
    "employee-id": can('settings', 'manage'),
    "domain-whitelist": can('settings', 'manage'),
    "office-location": can('settings', 'manage'),
    branding: can('settings', 'manage'),
    // Aturan persetujuan perubahan gaji: hanya admin (juga ditegakkan di basis data)
    payroll: isAdmin,
  };
  // Urutan tampilan; tab pertama yang dapat digunakan pengguna menjadi bawaan
  const TAB_ORDER: SettingsTab[] = [
    "user-roles", "departments", "leave-types", "employee-id", "domain-whitelist", "office-location", "branding", "payroll",
  ];
  const allowedTabs = TAB_ORDER.filter((t) => tabAllowed[t]);
  const activeTab: SettingsTab | undefined =
    requestedTab && tabAllowed[requestedTab] ? requestedTab : allowedTabs[0];
  
  // Status departemen
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<{ id: string } | null>(null);
  const [deptForm, setDeptForm] = useState<DepartmentForm>({ name: '', description: '' });
  
  // Status jenis cuti
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<{ id: string } | null>(null);
  const [leaveForm, setLeaveForm] = useState<LeaveTypeForm>({ 
    name: '', 
    description: '', 
    days_per_year: 0, 
    is_paid: true 
  });

  const { data: departments = [], isLoading: loadingDepts } = useDepartments();
  const { data: leaveTypes = [], isLoading: loadingLeaves } = useLeaveTypes();

  // Mutasi departemen - harus berada sebelum pengembalian awal
  const createDeptMutation = useMutation({
    mutationFn: async (data: DepartmentForm) => {
      const { error } = await supabase.from('departments').insert({
        name: data.name.trim(),
        description: data.description.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setDeptDialogOpen(false);
      setDeptForm({ name: '', description: '' });
      toast({ title: "Departemen dibuat", description: "Departemen baru telah ditambahkan." });
    },
    onError: (error: Error) => {
      toast({ title: "Kesalahan", description: error.message, variant: "destructive" });
    },
  });

  const updateDeptMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DepartmentForm }) => {
      const { error } = await supabase.from('departments').update({
        name: data.name.trim(),
        description: data.description.trim() || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setDeptDialogOpen(false);
      setEditingDept(null);
      setDeptForm({ name: '', description: '' });
      toast({ title: "Departemen diperbarui", description: "Departemen telah diperbarui." });
    },
    onError: (error: Error) => {
      toast({ title: "Kesalahan", description: error.message, variant: "destructive" });
    },
  });

  const deleteDeptMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({ title: "Departemen dihapus", description: "Departemen telah dihapus." });
    },
    onError: (error: Error) => {
      toast({ title: "Kesalahan", description: error.message, variant: "destructive" });
    },
  });

  // Mutasi jenis cuti - harus berada sebelum pengembalian awal
  const createLeaveMutation = useMutation({
    mutationFn: async (data: LeaveTypeForm) => {
      const { error } = await supabase.from('leave_types').insert({
        name: data.name.trim(),
        description: data.description.trim() || null,
        days_per_year: data.days_per_year,
        is_paid: data.is_paid,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      setLeaveDialogOpen(false);
      setLeaveForm({ name: '', description: '', days_per_year: 0, is_paid: true });
      toast({ title: "Jenis cuti dibuat", description: "Jenis cuti baru telah ditambahkan." });
    },
    onError: (error: Error) => {
      toast({ title: "Kesalahan", description: error.message, variant: "destructive" });
    },
  });

  const updateLeaveMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LeaveTypeForm }) => {
      const { error } = await supabase.from('leave_types').update({
        name: data.name.trim(),
        description: data.description.trim() || null,
        days_per_year: data.days_per_year,
        is_paid: data.is_paid,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      setLeaveDialogOpen(false);
      setEditingLeave(null);
      setLeaveForm({ name: '', description: '', days_per_year: 0, is_paid: true });
      toast({ title: "Jenis cuti diperbarui", description: "Jenis cuti telah diperbarui." });
    },
    onError: (error: Error) => {
      toast({ title: "Kesalahan", description: error.message, variant: "destructive" });
    },
  });

  const deleteLeaveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leave_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      toast({ title: "Jenis cuti dihapus", description: "Jenis cuti telah dihapus." });
    },
    onError: (error: Error) => {
      toast({ title: "Kesalahan", description: error.message, variant: "destructive" });
    },
  });

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

  // Aturan yang sama seperti bilah sisi: admin, atau hak kelola pada employees/leaves/settings
  if (!canAccessSettings(perms) || allowedTabs.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-destructive" />
          <h2 className="text-2xl font-bold text-foreground">Akses Ditolak</h2>
          <p className="text-muted-foreground">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          <p className="text-sm text-muted-foreground">Hubungi administrator jika Anda memerlukan akses ke pengaturan.</p>
        </div>
      </DashboardLayout>
    );
  }


  const handleEditDept = (dept: { id: string; name: string; description: string | null }) => {
    setEditingDept({ id: dept.id });
    setDeptForm({ name: dept.name, description: dept.description || '' });
    setDeptDialogOpen(true);
  };

  const handleEditLeave = (leave: { id: string; name: string; description: string | null; days_per_year: number; is_paid: boolean | null }) => {
    setEditingLeave({ id: leave.id });
    setLeaveForm({ 
      name: leave.name, 
      description: leave.description || '', 
      days_per_year: leave.days_per_year,
      is_paid: leave.is_paid ?? true,
    });
    setLeaveDialogOpen(true);
  };

  const handleDeptSubmit = () => {
    if (!deptForm.name.trim()) {
      toast({ title: "Kesalahan", description: "Nama departemen wajib diisi", variant: "destructive" });
      return;
    }
    if (editingDept) {
      updateDeptMutation.mutate({ id: editingDept.id, data: deptForm });
    } else {
      createDeptMutation.mutate(deptForm);
    }
  };

  const handleLeaveSubmit = () => {
    if (!leaveForm.name.trim()) {
      toast({ title: "Kesalahan", description: "Nama jenis cuti wajib diisi", variant: "destructive" });
      return;
    }
    if (editingLeave) {
      updateLeaveMutation.mutate({ id: editingLeave.id, data: leaveForm });
    } else {
      createLeaveMutation.mutate(leaveForm);
    }
  };

  const isDeptSaving = createDeptMutation.isPending || updateDeptMutation.isPending;
  const isLeaveSaving = createLeaveMutation.isPending || updateLeaveMutation.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Pengaturan</h1>
          <p className="text-muted-foreground">Kelola konfigurasi sistem</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setRequestedTab(v as SettingsTab)}>
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:flex sm:w-auto sm:flex-wrap sm:justify-start" aria-label="Bagian pengaturan">
            {tabAllowed["user-roles"] && (
              <TabsTrigger
                value="user-roles"
                className="min-h-10 w-full justify-start gap-2 sm:min-h-0 sm:w-auto sm:justify-center"
              >
                <Users className="h-4 w-4" aria-hidden="true" />
                <span>Pengguna &amp; akses</span>
              </TabsTrigger>
            )}
            {tabAllowed.departments && (
              <TabsTrigger value="departments" className="min-h-10 w-full justify-start gap-2 sm:min-h-0 sm:w-auto sm:justify-center">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                <span>Departemen</span>
              </TabsTrigger>
            )}
            {tabAllowed["leave-types"] && (
              <TabsTrigger value="leave-types" className="min-h-10 w-full justify-start gap-2 sm:min-h-0 sm:w-auto sm:justify-center">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                <span>Jenis cuti</span>
              </TabsTrigger>
            )}
            {tabAllowed["employee-id"] && (
              <TabsTrigger value="employee-id" className="min-h-10 w-full justify-start gap-2 sm:min-h-0 sm:w-auto sm:justify-center">
                <Hash className="h-4 w-4" aria-hidden="true" />
                <span>ID Karyawan</span>
              </TabsTrigger>
            )}
            {tabAllowed["domain-whitelist"] && (
              <TabsTrigger value="domain-whitelist" className="min-h-10 w-full justify-start gap-2 sm:min-h-0 sm:w-auto sm:justify-center">
                <Globe className="h-4 w-4" aria-hidden="true" />
                <span>Daftar putih domain</span>
              </TabsTrigger>
            )}
            {tabAllowed["office-location"] && (
              <TabsTrigger value="office-location" className="min-h-10 w-full justify-start gap-2 sm:min-h-0 sm:w-auto sm:justify-center">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                <span>Lokasi kantor</span>
              </TabsTrigger>
            )}
            {tabAllowed.branding && (
              <TabsTrigger value="branding" className="min-h-10 w-full justify-start gap-2 sm:min-h-0 sm:w-auto sm:justify-center">
                <Palette className="h-4 w-4" aria-hidden="true" />
                <span>Merek</span>
              </TabsTrigger>
            )}
            {tabAllowed.payroll && (
              <TabsTrigger value="payroll" className="min-h-10 w-full justify-start gap-2 sm:min-h-0 sm:w-auto sm:justify-center">
                <IndianRupee className="h-4 w-4" aria-hidden="true" />
                <span>Penggajian</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab Departemen */}
          {tabAllowed.departments && (
          <TabsContent value="departments" className="mt-6">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Departemen</CardTitle>
                  <CardDescription>Kelola departemen perusahaan</CardDescription>
                </div>
                <Dialog open={deptDialogOpen} onOpenChange={(open) => {
                  setDeptDialogOpen(open);
                  if (!open) {
                    setEditingDept(null);
                    setDeptForm({ name: '', description: '' });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                      Tambah departemen
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingDept ? 'Sunting departemen' : 'Tambah departemen'}</DialogTitle>
                      <DialogDescription>
                        {editingDept ? 'Perbarui detail departemen' : 'Buat departemen baru'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="deptName">Nama *</Label>
                        <Input
                          id="deptName"
                          value={deptForm.name}
                          onChange={(e) => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="mis., Teknik"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deptDescription">Deskripsi</Label>
                        <Textarea
                          id="deptDescription"
                          value={deptForm.description}
                          onChange={(e) => setDeptForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Deskripsi singkat departemen"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeptDialogOpen(false)}>Batal</Button>
                      <Button onClick={handleDeptSubmit} disabled={isDeptSaving}>
                        {isDeptSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingDept ? 'Perbarui' : 'Buat'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingDepts ? (
                  <div className="py-8 text-center text-muted-foreground">Memuat departemen...</div>
                ) : departments.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">Tidak ada departemen ditemukan. Tambahkan departemen pertama Anda.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead className="hidden sm:table-cell">Deskripsi</TableHead>
                        <TableHead className="w-24 text-right">Tindakan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departments.map((dept) => (
                        <TableRow key={dept.id}>
                          <TableCell>
                            <p className="font-medium">{dept.name}</p>
                            {dept.description && <p className="text-xs text-muted-foreground sm:hidden">{dept.description}</p>}
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground sm:table-cell">{dept.description || '—'}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => handleEditDept(dept)} aria-label={`Edit ${dept.name}`} title="Edit">
                                <Pencil className="h-4 w-4" aria-hidden="true" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 text-destructive hover:text-destructive"
                                onClick={() => deleteDeptMutation.mutate(dept.id)}
                                disabled={deleteDeptMutation.isPending}
                                aria-label={`Hapus ${dept.name}`}
                                title="Hapus"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Tab Jenis Cuti */}
          {tabAllowed["leave-types"] && (
          <TabsContent value="leave-types" className="mt-6">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Jenis cuti</CardTitle>
                  <CardDescription>Konfigurasi jenis cuti yang tersedia beserta kebijakannya</CardDescription>
                </div>
                <Dialog open={leaveDialogOpen} onOpenChange={(open) => {
                  setLeaveDialogOpen(open);
                  if (!open) {
                    setEditingLeave(null);
                    setLeaveForm({ name: '', description: '', days_per_year: 0, is_paid: true });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                      Tambah jenis cuti
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingLeave ? 'Sunting jenis cuti' : 'Tambah jenis cuti'}</DialogTitle>
                      <DialogDescription>
                        {editingLeave ? 'Perbarui detail jenis cuti' : 'Buat jenis cuti baru'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="leaveName">Nama *</Label>
                        <Input
                          id="leaveName"
                          value={leaveForm.name}
                          onChange={(e) => setLeaveForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="mis., Cuti Tahunan"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="leaveDescription">Deskripsi</Label>
                        <Textarea
                          id="leaveDescription"
                          value={leaveForm.description}
                          onChange={(e) => setLeaveForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Deskripsi singkat jenis cuti ini"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="daysPerYear">Hari per tahun</Label>
                        <Input
                          id="daysPerYear"
                          type="number"
                          min="0"
                          value={leaveForm.days_per_year}
                          onChange={(e) => setLeaveForm(prev => ({ ...prev, days_per_year: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div>
                          <Label htmlFor="isPaid">Cuti dibayar</Label>
                          <p className="text-xs text-muted-foreground">Karyawan menerima gaji selama cuti ini</p>
                        </div>
                        <Switch
                          id="isPaid"
                          checked={leaveForm.is_paid}
                          onCheckedChange={(checked) => setLeaveForm(prev => ({ ...prev, is_paid: checked }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>Batal</Button>
                      <Button onClick={handleLeaveSubmit} disabled={isLeaveSaving}>
                        {isLeaveSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingLeave ? 'Perbarui' : 'Buat'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingLeaves ? (
                  <div className="py-8 text-center text-muted-foreground">Memuat jenis cuti...</div>
                ) : leaveTypes.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">Tidak ada jenis cuti ditemukan. Tambahkan jenis cuti pertama Anda.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead className="whitespace-nowrap">Hari/tahun</TableHead>
                        <TableHead className="hidden sm:table-cell">Jenis</TableHead>
                        <TableHead className="hidden md:table-cell">Deskripsi</TableHead>
                        <TableHead className="w-24 text-right">Tindakan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaveTypes.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell>
                            <p className="font-medium">{leave.name}</p>
                            <Badge variant="outline" className={`mt-1 sm:hidden ${toneClass(leave.is_paid ? "success" : "neutral")}`}>
                              {leave.is_paid ? "Dibayar" : "Tidak dibayar"}
                            </Badge>
                          </TableCell>
                          <TableCell>{leave.days_per_year}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline" className={toneClass(leave.is_paid ? "success" : "neutral")}>
                              {leave.is_paid ? "Dibayar" : "Tidak dibayar"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground md:table-cell">{leave.description || '—'}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => handleEditLeave(leave)} aria-label={`Edit ${leave.name}`} title="Edit">
                                <Pencil className="h-4 w-4" aria-hidden="true" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 text-destructive hover:text-destructive"
                                onClick={() => deleteLeaveMutation.mutate(leave.id)}
                                disabled={deleteLeaveMutation.isPending}
                                aria-label={`Hapus ${leave.name}`}
                                title="Hapus"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Pengguna & akses - hanya admin (RLS juga membatasi peran/izin untuk admin) */}
          {tabAllowed["user-roles"] && (
            <TabsContent value="user-roles" className="mt-6 space-y-6">
              <UserRolesManager />
              <RolePermissionsMatrix />
            </TabsContent>
          )}

          {/* Tab Pola ID Karyawan - settings:manage */}
          {tabAllowed["employee-id"] && (
            <TabsContent value="employee-id" className="mt-6">
              <EmployeeCodeSettings />
            </TabsContent>
          )}

          {/* Tab Daftar Putih Domain - settings:manage */}
          {tabAllowed["domain-whitelist"] && (
            <TabsContent value="domain-whitelist" className="mt-6">
              <DomainWhitelistSettings />
            </TabsContent>
          )}

          {/* Tab Lokasi Kantor - settings:manage */}
          {tabAllowed["office-location"] && (
            <TabsContent value="office-location" className="mt-6">
              <OfficeLocationSettings />
            </TabsContent>
          )}

          {/* Tab Merek - settings:manage */}
          {tabAllowed["branding"] && (
            <TabsContent value="branding" className="mt-6">
              <BrandingSettings />
            </TabsContent>
          )}

          {tabAllowed.payroll && (
            <TabsContent value="payroll" className="mt-6">
              <PayrollSettings />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
