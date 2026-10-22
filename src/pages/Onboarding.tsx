import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkingDaysPicker } from "@/components/employees/WorkingDaysPicker";
import { statusBadgeClass } from "@/lib/statusStyles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Upload, User, Briefcase, FileText, Loader2, ShieldAlert, Calendar, Mail, Phone, MapPin, Pencil, X, Check, Download, ExternalLink, Send, Clock, UserPlus, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDepartments } from "@/hooks/useEmployees";
import { useNextEmployeeCode, isValidEmployeeCode } from "@/hooks/useNextEmployeeCode";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { PendingHires } from "@/components/onboarding/PendingHires";
import { LeavingList } from "@/components/offboarding/LeavingList";
import { useEmployeeExits } from "@/hooks/useOffboarding";
import { sendInvitation } from "@/components/onboarding/inviteEmployee";
import { useLocation } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Ambil karyawan yang berstatus dalam proses orientasi (onboarding)
const useOnboardingEmployees = () => {
  return useQuery({
    queryKey: ['onboarding-employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          address,
          avatar_url,
          hire_date,
          designation,
          department_id,
          manager_id,
          user_id,
          working_hours_start,
          working_hours_end,
          working_days,
          departments!employees_department_id_fkey (name)
        `)
        .eq('status', 'onboarding');
      
      if (error) throw error;
      return data || [];
    },
  });
};

type OnboardingEmployee = NonNullable<ReturnType<typeof useOnboardingEmployees>["data"]>[number];

// Ambil dokumen untuk karyawan tertentu
const useEmployeeDocuments = (employeeId: string | null) => {
  return useQuery({
    queryKey: ['employee-documents', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!employeeId,
  });
};

// Ambil karyawan aktif yang dapat menjadi manajer
const useManagers = () => {
  return useQuery({
    queryKey: ['managers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('status', 'active')
        .order('first_name');
      
      if (error) throw error;
      return data || [];
    },
  });
};


interface DocumentUpload {
  file: File | null;
  uploading: boolean;
  uploaded: boolean;
  url: string | null;
}

interface FormData {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  departmentId: string;
  designation: string;
  managerId: string;
  joinDate: string;
  isDepartmentManager: boolean;
  sendInvite: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: number[];
}

const initialFormData: FormData = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  dateOfBirth: '',
  gender: '',
  departmentId: '',
  designation: '',
  managerId: '',
  joinDate: '',
  isDepartmentManager: false,
  sendInvite: true,
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  workingDays: [1, 2, 3, 4, 5], // Senin-Jumat
};

const REQUIRED_DOCUMENT_TYPES = [
  { key: 'id_proof', label: 'Bukti Identitas', accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'offer_letter', label: 'Surat Penawaran Kerja', accept: '.pdf,.doc,.docx' },
  { key: 'resume', label: 'Curriculum Vitae', accept: '.pdf,.doc,.docx' },
];

const ALL_DOCUMENT_TYPES = [
  { key: 'contract', label: 'Kontrak', accept: '.pdf,.doc,.docx' },
  ...REQUIRED_DOCUMENT_TYPES,
  { key: 'other', label: 'Lainnya', accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png' },
];

const initialDocuments: Record<string, DocumentUpload> = {
  id_proof: { file: null, uploading: false, uploaded: false, url: null },
  offer_letter: { file: null, uploading: false, uploaded: false, url: null },
  resume: { file: null, uploading: false, uploaded: false, url: null },
};

const Onboarding = () => {
  const currentLocation = useLocation();
  const searchParams = new URLSearchParams(currentLocation.search);
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'add');
  const [selectedEmployee, setSelectedEmployee] = useState<OnboardingEmployee | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    departmentId: '',
    designation: '',
    managerId: '',
    joinDate: '',
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
    workingDays: [1, 2, 3, 4, 5] as number[],
  });
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [documents, setDocuments] = useState<Record<string, DocumentUpload>>(initialDocuments);
  const [additionalDoc, setAdditionalDoc] = useState<{ file: File | null; type: string }>({ file: null, type: '' });
  const [isUploadingAdditional, setIsUploadingAdditional] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { can, isLoading: roleLoading } = usePermissions();
  const canView = can('onboarding', 'view');
  const canManage = can('onboarding', 'manage');
  const { data: exits = [] } = useEmployeeExits(canView);
  
  const { data: departments = [], isLoading: loadingDepartments } = useDepartments();
  const { data: managers = [], isLoading: loadingManagers } = useManagers();
  const { data: onboardingEmployees = [], isLoading: loadingOnboarding } = useOnboardingEmployees();
  const { data: employeeDocs = [], isLoading: loadingDocs } = useEmployeeDocuments(selectedEmployee?.id || null);
  const { data: nextEmployeeCode, isLoading: loadingNextCode } = useNextEmployeeCode();

  // Ambil URL bertanda tangan untuk mengunduh dokumen
  const getDocumentUrl = async (filePath: string, bucket: 'employee-documents' | 'onboarding-documents' = 'employee-documents') => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600); // Kedaluwarsa 1 jam

    if (error) {
      toast({
        title: "Kesalahan",
        description: "Gagal mendapatkan URL dokumen",
        variant: "destructive",
      });
      return null;
    }
    return data.signedUrl;
  };

  const handleViewDocument = async (filePath: string, bucket: 'employee-documents' | 'onboarding-documents' = 'employee-documents') => {
    const url = await getDocumentUrl(filePath, bucket);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleDownloadDocument = async (filePath: string, fileName: string, bucket: 'employee-documents' | 'onboarding-documents' = 'employee-documents') => {
    const url = await getDocumentUrl(filePath, bucket);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFileSelect = (docType: string, file: File | null) => {
    setDocuments(prev => ({
      ...prev,
      [docType]: { ...prev[docType], file, uploaded: false, url: null }
    }));
  };

  // Unggah satu dokumen
  const uploadDocument = async (employeeId: string, docType: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${employeeId}/${docType}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('employee-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('employee-documents')
      .getPublicUrl(fileName);

    // Simpan referensi dokumen di database
    const { error: dbError } = await supabase
      .from('employee_documents')
      .insert({
        employee_id: employeeId,
        document_type: docType,
        document_name: file.name,
        file_url: fileName, // Simpan path, bukan URL publik (bucket bersifat privat)
      });

    if (dbError) throw dbError;

    return fileName;
  };

  // Unggah dokumen tambahan untuk karyawan yang sudah ada
  const handleUploadAdditionalDocument = async () => {
    if (!selectedEmployee || !additionalDoc.file || !additionalDoc.type) {
      toast({
        title: "Kesalahan",
        description: "Silakan pilih jenis dokumen dan berkas",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAdditional(true);
    try {
      await uploadDocument(selectedEmployee.id, additionalDoc.type, additionalDoc.file);
      queryClient.invalidateQueries({ queryKey: ['employee-documents', selectedEmployee.id] });
      setAdditionalDoc({ file: null, type: '' });
      toast({
        title: "Berhasil",
        description: "Dokumen berhasil diunggah",
      });
    } catch (error) {
      toast({
        title: "Kesalahan",
        description: error instanceof Error ? error.message : "Gagal mengunggah dokumen",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAdditional(false);
    }
  };

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const selectedDept = departments.find(d => d.id === data.departmentId);
      const warnings: string[] = [];

      // Karyawan baru menunggu di status 'onboarding' sampai menerima undistannya; orang
      // yang tidak akan masuk (tanpa undangan) langsung berstatus aktif.
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .insert({
          employee_code: data.employeeCode.trim().toUpperCase(),
          first_name: data.firstName.trim(),
          last_name: data.lastName.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone.trim() || null,
          address: data.address.trim() || null,
          date_of_birth: data.dateOfBirth || null,
          gender: data.gender || null,
          department_id: data.departmentId || null,
          designation: data.designation.trim(),
          manager_id: data.managerId || null,
          hire_date: data.joinDate,
          status: data.sendInvite ? 'onboarding' : 'active',
          working_hours_start: data.workingHoursStart ? `${data.workingHoursStart}:00` : '09:00:00',
          working_hours_end: data.workingHoursEnd ? `${data.workingHoursEnd}:00` : '18:00:00',
          working_days: data.workingDays,
        })
        .select()
        .single();

      if (employeeError) throw employeeError;

      for (const [docType, doc] of Object.entries(documents)) {
        if (!doc.file) continue;
        try {
          await uploadDocument(employee.id, docType, doc.file);
        } catch (err) {
          console.error(`Gagal mengunggah ${docType}:`, err);
          warnings.push(`${doc.file.name} tidak dapat diunggah`);
        }
      }

      // Kabari manajer dan HR tentang karyawan baru (fire and forget)
      supabase.functions.invoke("onboarding-notification", {
        body: {
          employee_id: employee.id,
          employee_name: `${data.firstName.trim()} ${data.lastName.trim()}`,
          employee_email: data.email.trim(),
          designation: data.designation.trim(),
          department_name: selectedDept?.name,
          join_date: data.joinDate,
          manager_id: data.managerId || undefined,
        }
      }).catch(err => {
        console.error("Gagal mengirim notifikasi orientasi:", err);
      });

      let invite: 'sent' | 'linked' | 'skipped' | 'failed' = 'skipped';
      let inviteError: string | null = null;
      if (data.sendInvite) {
        try {
          const result = await sendInvitation(employee.id);
          invite = result.status === 'linked' ? 'linked' : 'sent';
        } catch (err) {
          invite = 'failed';
          inviteError = err instanceof Error ? err.message : 'Kesalahan tidak dikenal';
        }
      }

      return { employee, invite, inviteError, warnings };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['next-employee-code'] });
      queryClient.invalidateQueries({ queryKey: ['user-invitations'] });
      setFormData(initialFormData);
      setDocuments(initialDocuments);
      const name = result.employee.first_name;
      if (result.invite === 'failed') {
        setActiveTab('pending');
        toast({
          title: `${name} telah ditambahkan, tetapi undistannya tidak terkirim`,
          description: `${result.inviteError} Perbaiki masalahnya, lalu gunakan "Kirim undangan" di menu Tertunda.`,
          variant: "destructive",
        });
      } else if (result.invite === 'sent') {
        setActiveTab('pending');
        toast({
          title: "Karyawan ditambahkan dan diundang",
          description: `${name} akan menerima email di ${result.employee.email} untuk mengatur akunnya. Mereka akan tampil di Tertunda sampai akunnya terkonfigurasi.`,
        });
      } else if (result.invite === 'linked') {
        toast({
          title: "Karyawan ditambahkan",
          description: `${result.employee.email} sudah memiliki akun, sehingga ${name} telah terhubung dan berstatus aktif.`,
        });
      } else {
        toast({
          title: "Karyawan ditambahkan",
          description: `${name} berstatus aktif. Mereka tidak dapat masuk sebelum Anda mengundangnya dari barisnya di halaman Karyawan.`,
        });
      }
      if (result.warnings.length > 0) {
        toast({
          title: "Sebagian detail tidak tersimpan",
          description: result.warnings.join('. ') + '.',
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Karyawan tidak ditambahkan",
        description: error.message || "Silakan coba lagi.",
        variant: "destructive",
      });
    },
  });

  // Tandai seseorang sudah bergabung tanpa menunggu dia menerima undangan
  // (misalnya dia tidak akan memakai aplikasi). Saldo cuti dibuat oleh database.
  const activateEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase
        .from('employees')
        .update({ status: 'active' })
        .eq('id', employeeId);
      if (error) throw error;
      return employeeId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setSelectedEmployee(null);
      toast({
        title: "Ditandai sudah bergabung",
        description: "Mereka kini berstatus aktif dan saldo cutinya sudah disiapkan. Undangan yang masih ada tetap berlaku.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Kesalahan",
        description: error.message || "Gagal mengaktifkan karyawan.",
        variant: "destructive",
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: typeof editFormData & { id: string }) => {
      const { error } = await supabase
        .from('employees')
        .update({
          first_name: data.firstName.trim(),
          last_name: data.lastName.trim(),
          email: data.email.trim(),
          phone: data.phone.trim() || null,
          address: data.address.trim() || null,
          department_id: data.departmentId || null,
          designation: data.designation.trim(),
          manager_id: data.managerId || null,
          hire_date: data.joinDate,
          working_hours_start: data.workingHoursStart ? `${data.workingHoursStart}:00` : '09:00:00',
          working_hours_end: data.workingHoursEnd ? `${data.workingHoursEnd}:00` : '18:00:00',
          working_days: data.workingDays,
        })
        .eq('id', data.id);
      
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsEditing(false);
      setSelectedEmployee(null);
      toast({
        title: "Karyawan Diperbarui",
        description: "Detail karyawan berhasil diperbarui.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Kesalahan",
        description: error.message || "Gagal memperbarui karyawan.",
        variant: "destructive",
      });
    },
  });

  const openEditMode = (employee: OnboardingEmployee) => {
    // Ubah jam kerja dari format WAKTU (HH:MM:SS) ke format input (HH:MM)
    const parseTime = (time: string | null) => {
      if (!time) return '09:00';
      return time.substring(0, 5); // Ambil HH:MM dari HH:MM:SS
    };
    
    setEditFormData({
      firstName: employee.first_name || '',
      lastName: employee.last_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      address: employee.address || '',
      departmentId: employee.department_id || '',
      designation: employee.designation || '',
      managerId: employee.manager_id || '',
      joinDate: employee.hire_date || '',
      workingHoursStart: parseTime(employee.working_hours_start),
      workingHoursEnd: parseTime(employee.working_hours_end),
      workingDays: employee.working_days || [1, 2, 3, 4, 5],
    });
    setIsEditing(true);
  };

  const handleEditSubmit = () => {
    if (!selectedEmployee) return;
    
    if (!editFormData.firstName.trim()) {
      toast({ title: "Kesalahan", description: "Nama depan wajib diisi", variant: "destructive" });
      return;
    }
    if (!editFormData.lastName.trim()) {
      toast({ title: "Kesalahan", description: "Nama belakang wajib diisi", variant: "destructive" });
      return;
    }
    if (!editFormData.email.trim()) {
      toast({ title: "Kesalahan", description: "Email wajib diisi", variant: "destructive" });
      return;
    }
    if (!editFormData.designation.trim()) {
      toast({ title: "Kesalahan", description: "Jabatan wajib diisi", variant: "destructive" });
      return;
    }
    if (!editFormData.joinDate) {
      toast({ title: "Kesalahan", description: "Tanggal bergabung wajib diisi", variant: "destructive" });
      return;
    }

    updateEmployeeMutation.mutate({ ...editFormData, id: selectedEmployee.id });
  };

  if (roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!canView) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Akses ditolak</h1>
          <p className="text-muted-foreground">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          <p className="text-sm text-muted-foreground">Mintalah akses untuk modul orientasi kepada administrator.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Gunakan kode berikutnya jika belum diisi
    const codeToUse = formData.employeeCode.trim() || nextEmployeeCode || '';
    
    // Validasi
    if (!codeToUse) {
      toast({ title: "Kesalahan", description: "Kode karyawan wajib diisi", variant: "destructive" });
      return;
    }
    if (!isValidEmployeeCode(codeToUse)) {
      toast({ title: "Kesalahan", description: "Kode karyawan harus berformat ACQ001", variant: "destructive" });
      return;
    }
    if (!formData.firstName.trim()) {
      toast({ title: "Kesalahan", description: "Nama depan wajib diisi", variant: "destructive" });
      return;
    }
    if (!formData.lastName.trim()) {
      toast({ title: "Kesalahan", description: "Nama belakang wajib diisi", variant: "destructive" });
      return;
    }
    if (!formData.email.trim()) {
      toast({ title: "Kesalahan", description: "Email wajib diisi", variant: "destructive" });
      return;
    }
    if (!formData.designation.trim()) {
      toast({ title: "Kesalahan", description: "Jabatan wajib diisi", variant: "destructive" });
      return;
    }
    if (!formData.joinDate) {
      toast({ title: "Kesalahan", description: "Tanggal bergabung wajib diisi", variant: "destructive" });
      return;
    }
    if (!formData.isDepartmentManager && !formData.managerId) {
      toast({ title: "Kesalahan", description: "Manajer pelapor wajib diisi untuk karyawan yang bukan kepala departemen", variant: "destructive" });
      return;
    }

    createEmployeeMutation.mutate({ ...formData, employeeCode: codeToUse });
  };

  const isSubmitting = createEmployeeMutation.isPending;

  // Orang dengan izin onboarding:view saja tidak dapat membuat karyawan, sehingga tab Tambah tidak ditampilkan
  const availableTabs = canManage ? ['add', 'pending', 'leaving'] : ['pending', 'leaving'];
  const currentTab = availableTabs.includes(activeTab) ? activeTab : availableTabs[0];
  const pendingOnboardingCount = onboardingEmployees.length;
  const leavingCount = exits.filter((x) => x.status === 'requested' || x.status === 'in_progress').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {!canManage && (
          <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            Anda hanya dapat melihat modul orientasi. Hubungi administrator jika Anda perlu menambahkan karyawan atau
            mengirim undangan.
          </p>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Orientasi</h1>
          <p className="text-muted-foreground">
            Tambahkan karyawan baru dan undang mereka untuk mengatur akun, serta lihat siapa yang akan keluar.
          </p>
        </div>
        <Tabs value={currentTab} onValueChange={setActiveTab}>
          <TabsList className="flex w-full justify-start sm:w-auto sm:max-w-2xl">
            {canManage && (
              <TabsTrigger value="add" className="shrink-0 px-2 sm:px-3">
                Tambah<span className="hidden sm:inline">&nbsp;karyawan</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="pending" className="shrink-0 px-2 sm:px-3">
              Tertunda
              {pendingOnboardingCount > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-xs font-semibold tabular-nums text-primary" aria-label={`${pendingOnboardingCount} tertunda`}>
                  {pendingOnboardingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="leaving" className="shrink-0 px-2 sm:px-3">
              Keluar
              {leavingCount > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-xs font-semibold tabular-nums text-primary" aria-label={`${leavingCount} keluar`}>
                  {leavingCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {canManage && (
          <TabsContent value="add" className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Informasi Pribadi */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Informasi Pribadi</CardTitle>
                        <CardDescription>Data dasar karyawan</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nama Depan *</Label>
                        <Input 
                          id="firstName" 
                          placeholder="John" 
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nama Belakang *</Label>
                        <Input 
                          id="lastName" 
                          placeholder="Doe" 
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Alamat Email *</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="john.doe@company.com" 
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Nomor Telepon</Label>
                      <Input 
                        id="phone" 
                        placeholder="+1 (555) 000-0000" 
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Alamat</Label>
                      <Textarea
                        id="address"
                        placeholder="Masukkan alamat lengkap"
                        rows={3}
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Tanggal Lahir</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Jenis Kelamin</Label>
                        <Select
                          value={formData.gender}
                          onValueChange={(value) => handleInputChange('gender', value)}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger id="gender">
                            <SelectValue placeholder="Pilih jenis kelamin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Laki-laki</SelectItem>
                            <SelectItem value="female">Perempuan</SelectItem>
                            <SelectItem value="other">Lainnya</SelectItem>
                            <SelectItem value="prefer_not_to_say">Tidak ingin menyebutkan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Informasi Jabatan */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Briefcase className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Informasi Jabatan</CardTitle>
                        <CardDescription>Detail peran dan departemen</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="employeeCode">Nomor Karyawan *</Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          id="employeeCode" 
                          placeholder={loadingNextCode ? "Memuat..." : nextEmployeeCode || "ACQ001"}
                          value={formData.employeeCode}
                          onChange={(e) => handleInputChange('employeeCode', e.target.value.toUpperCase())}
                          disabled={isSubmitting || loadingNextCode}
                          className="pl-9 font-mono"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Nomor berikutnya yang tersedia: {loadingNextCode ? "..." : nextEmployeeCode}. Anda dapat mengubahnya bila perlu.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Departemen</Label>
                      <Select 
                        disabled={loadingDepartments || isSubmitting}
                        value={formData.departmentId}
                        onValueChange={(value) => handleInputChange('departmentId', value)}
                      >
                        <SelectTrigger id="department">
                          <SelectValue placeholder={loadingDepartments ? "Memuat..." : "Pilih departemen"} />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="designation">Jabatan *</Label>
                      <Input 
                        id="designation" 
                        placeholder="mis., Senior Developer" 
                        value={formData.designation}
                        onChange={(e) => handleInputChange('designation', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="isDeptManager">Kepala Departemen</Label>
                        <p className="text-xs text-muted-foreground">
                          Tandai karyawan ini sebagai kepala departemennya
                        </p>
                      </div>
                      <Switch
                        id="isDeptManager"
                        checked={formData.isDepartmentManager}
                        onCheckedChange={(checked) => handleInputChange('isDepartmentManager', checked)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manager">
                        Manajer Pelapor {!formData.isDepartmentManager && '*'}
                      </Label>
                      <Select 
                        disabled={loadingManagers || isSubmitting}
                        value={formData.managerId}
                        onValueChange={(value) => handleInputChange('managerId', value)}
                      >
                        <SelectTrigger id="manager">
                          <SelectValue placeholder={loadingManagers ? "Memuat..." : "Pilih manajer"} />
                        </SelectTrigger>
                        <SelectContent>
                          {managers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.first_name} {manager.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!formData.isDepartmentManager && (
                        <p className="text-xs text-muted-foreground">
                          Wajib diisi untuk karyawan yang bukan kepala departemen
                        </p>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="joinDate">Tanggal Bergabung *</Label>
                        <Input 
                          id="joinDate" 
                          type="date" 
                          value={formData.joinDate}
                          onChange={(e) => handleInputChange('joinDate', e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    
                    {/* Bagian Jam Kerja */}
                    <div className="space-y-4 rounded-lg border border-border p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <Label className="text-base font-medium">Jadwal Kerja</Label>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="workingHoursStart">Waktu Mulai</Label>
                          <Input 
                            id="workingHoursStart" 
                            type="time" 
                            value={formData.workingHoursStart}
                            onChange={(e) => handleInputChange('workingHoursStart', e.target.value)}
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="workingHoursEnd">Waktu Selesai</Label>
                          <Input 
                            id="workingHoursEnd" 
                            type="time" 
                            value={formData.workingHoursEnd}
                            onChange={(e) => handleInputChange('workingHoursEnd', e.target.value)}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label id="add-working-days-label">Hari kerja</Label>
                        <WorkingDaysPicker
                          labelledBy="add-working-days-label"
                          value={formData.workingDays}
                          disabled={isSubmitting}
                          onChange={(days) => setFormData(prev => ({ ...prev, workingDays: days }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Pilih hari kerja untuk karyawan ini
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Dokumen */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Dokumen</CardTitle>
                        <CardDescription>Unggah dokumen yang diperlukan (opsional)</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {REQUIRED_DOCUMENT_TYPES.map((docType) => {
                        const doc = documents[docType.key];
                        return (
                          <label
                            key={docType.key}
                            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors cursor-pointer ${
                              doc.file 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary hover:bg-primary/5'
                            } ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
                          >
                            <input
                              type="file"
                              accept={docType.accept}
                              className="sr-only"
                              disabled={isSubmitting}
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                handleFileSelect(docType.key, file);
                              }}
                            />
                            {doc.file ? (
                              <>
                                <Check className="mb-2 h-8 w-8 text-primary" />
                                <p className="text-sm font-medium text-foreground truncate max-w-full px-2">
                                  {doc.file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {(doc.file.size / 1024).toFixed(1)} KB
                                </p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-1 right-1 h-9 w-9"
                                  aria-label={`Hapus berkas ${docType.label}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleFileSelect(docType.key, null);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                                <p className="text-sm font-medium text-foreground">{docType.label}</p>
                                <p className="text-xs text-muted-foreground">Klik untuk mengunggah</p>
                              </>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <Switch
                      id="sendInvite"
                      checked={formData.sendInvite}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendInvite: checked }))}
                      disabled={isSubmitting}
                      className="mt-0.5"
                    />
                    <div>
                      <Label htmlFor="sendInvite" className="font-medium">Undang mereka untuk mengatur akunnya</Label>
                      <p className="text-sm text-muted-foreground">
                        {formData.sendInvite
                          ? "Kami akan mengirim email berisi tautan untuk memilih kata sandi. Mereka tetap berada di Tertunda sampai akunnya diatur, lalu menjadi aktif."
                          : "Tidak ada email yang dikirim. Mereka ditambahkan sebagai aktif, dan Anda dapat mengundangnya nanti dari halaman Karyawan."}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 justify-end gap-3">
                    <Button
                      variant="outline"
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        setFormData(initialFormData);
                        setDocuments(initialDocuments);
                      }}
                    >
                      Kosongkan formulir
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : formData.sendInvite ? (
                        <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                      )}
                      {formData.sendInvite ? "Tambah dan undang" : "Tambah karyawan"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>
          )}

          <TabsContent value="pending" className="mt-6">
            <PendingHires
              hires={onboardingEmployees}
              isLoading={loadingOnboarding}
              canManage={canManage}
              onAddEmployee={canManage ? () => setActiveTab('add') : undefined}
              onOpenDetails={(id) => setSelectedEmployee(onboardingEmployees.find((e) => e.id === id) ?? null)}
            />
          </TabsContent>

          <TabsContent value="leaving" className="mt-6">
            <LeavingList canManage={canManage} />
          </TabsContent>
        </Tabs>

        {/* Dialog Detail Karyawan */}
        <Dialog 
          open={!!selectedEmployee} 
          onOpenChange={(open) => {
            if (!open) {
              setSelectedEmployee(null);
              setIsEditing(false);
            }
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Sunting Karyawan' : 'Detail Karyawan'}</DialogTitle>
              <DialogDescription>
                {isEditing ? 'Perbarui informasi karyawan dalam proses orientasi' : 'Informasi karyawan dalam proses orientasi'}
              </DialogDescription>
            </DialogHeader>
            {selectedEmployee && !isEditing && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedEmployee.avatar_url || undefined} />
                      <AvatarFallback className="text-lg">
                        {`${selectedEmployee.first_name} ${selectedEmployee.last_name}`.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{selectedEmployee.first_name} {selectedEmployee.last_name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedEmployee.designation || 'Tanpa jabatan'}</p>
                    </div>
                  </div>
                  {canManage && (
                    <Button variant="outline" size="icon" onClick={() => openEditMode(selectedEmployee)} aria-label="Sunting detail karyawan" title="Sunting">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Departemen</p>
                      <p className="text-sm font-medium">{selectedEmployee.departments?.name || 'Belum ditugaskan'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tanggal Mulai</p>
                      <p className="text-sm font-medium">
                        {selectedEmployee.hire_date 
                          ? new Date(selectedEmployee.hire_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                          : 'Belum ditentukan'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{selectedEmployee.email || '-'}</p>
                    </div>
                  </div>
                  
                  {selectedEmployee.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Telepon</p>
                        <p className="text-sm font-medium">{selectedEmployee.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedEmployee.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Alamat</p>
                        <p className="text-sm font-medium">{selectedEmployee.address}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Jadwal Kerja */}
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Jadwal Kerja</p>
                      <p className="text-sm font-medium">
                        {selectedEmployee.working_hours_start?.substring(0, 5) || '09:00'} - {selectedEmployee.working_hours_end?.substring(0, 5) || '18:00'}
                      </p>
                      <WorkingDaysPicker
                        readOnly
                        className="mt-1 gap-1 [&>span]:h-7 [&>span]:min-w-[2.5rem] [&>span]:px-2 [&>span]:text-xs"
                        value={selectedEmployee.working_days || [1, 2, 3, 4, 5]}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Bagian Dokumen */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Dokumen
                  </p>
                  {loadingDocs ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : employeeDocs.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">Tidak ada dokumen yang diunggah</p>
                  ) : (
                    <div className="space-y-2">
                      {employeeDocs.map((doc) => {
                        const docTypeLabel = ALL_DOCUMENT_TYPES.find(d => d.key === doc.document_type)?.label || doc.document_type;
                        return (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{docTypeLabel}</p>
                                <p className="text-xs text-muted-foreground truncate">{doc.document_name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleViewDocument(doc.file_url)}
                                title="Lihat"
                                aria-label={`Lihat ${docTypeLabel}`}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDownloadDocument(doc.file_url, doc.document_name)}
                                title="Unduh"
                                aria-label={`Unduh ${docTypeLabel}`}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Unggah Dokumen Tambahan */}
                  {canManage && (
                  <div className="space-y-3 pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground">Unggah Dokumen Tambahan</p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Select
                        value={additionalDoc.type}
                        onValueChange={(value) => setAdditionalDoc(prev => ({ ...prev, type: value }))}
                        disabled={isUploadingAdditional}
                      >
                        <SelectTrigger className="w-full sm:w-[140px]" aria-label="Jenis dokumen">
                          <SelectValue placeholder="Jenis" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_DOCUMENT_TYPES.map((docType) => (
                            <SelectItem key={docType.key} value={docType.key}>
                              {docType.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2 flex-1">
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          disabled={isUploadingAdditional}
                          aria-label="Berkas dokumen"
                          onChange={(e) => setAdditionalDoc(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                          className="text-xs flex-1 min-w-0"
                        />
                        <Button
                          size="sm"
                          onClick={handleUploadAdditionalDocument}
                          aria-label="Unggah dokumen"
                          disabled={isUploadingAdditional || !additionalDoc.file || !additionalDoc.type}
                        >
                          {isUploadingAdditional ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {additionalDoc.file && (
                      <p className="text-xs text-muted-foreground truncate">
                        Terpilih: {additionalDoc.file.name}
                      </p>
                    )}
                  </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <Badge variant="outline" className={statusBadgeClass("onboarding")}>Orientasi</Badge>
                  {canManage && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm"
                        disabled={activateEmployeeMutation.isPending}
                      >
                        {activateEmployeeMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        Tandai sudah bergabung
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tandai {selectedEmployee.first_name} sudah bergabung?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Gunakan ini jika {selectedEmployee.first_name} sudah mulai bekerja namun belum menerima undangan. Mereka akan berstatus aktif dan memperoleh saldo cuti tahun ini. Jika nanti mereka mengatur akunnya, akun tersebut otomatis terhubung.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => activateEmployeeMutation.mutate(selectedEmployee.id)}
                        >
                          Tandai sudah bergabung
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  )}
                </div>
              </div>
            )}
            
            {selectedEmployee && isEditing && canManage && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-firstName">Nama Depan *</Label>
                    <Input
                      id="edit-firstName"
                      value={editFormData.firstName}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                      disabled={updateEmployeeMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-lastName">Nama Belakang *</Label>
                    <Input
                      id="edit-lastName"
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                      disabled={updateEmployeeMutation.isPending}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    disabled={updateEmployeeMutation.isPending}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telepon</Label>
                  <Input
                    id="edit-phone"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    disabled={updateEmployeeMutation.isPending}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-designation">Jabatan *</Label>
                  <Input
                    id="edit-designation"
                    value={editFormData.designation}
                    onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                    disabled={updateEmployeeMutation.isPending}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Departemen</Label>
                  <Select
                    value={editFormData.departmentId}
                    onValueChange={(value) => setEditFormData({ ...editFormData, departmentId: value })}
                    disabled={updateEmployeeMutation.isPending || loadingDepartments}
                  >
                    <SelectTrigger id="edit-department">
                      <SelectValue placeholder="Pilih departemen" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-manager">Manajer</Label>
                  <Select
                    value={editFormData.managerId}
                    onValueChange={(value) => setEditFormData({ ...editFormData, managerId: value === 'none' ? '' : value })}
                    disabled={updateEmployeeMutation.isPending || loadingManagers}
                  >
                    <SelectTrigger id="edit-manager">
                      <SelectValue placeholder="Pilih manajer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tanpa manajer</SelectItem>
                      {managers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.first_name} {m.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-joinDate">Tanggal Bergabung *</Label>
                  <Input
                    id="edit-joinDate"
                    type="date"
                    value={editFormData.joinDate}
                    onChange={(e) => setEditFormData({ ...editFormData, joinDate: e.target.value })}
                    disabled={updateEmployeeMutation.isPending}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Alamat</Label>
                  <Textarea
                    id="edit-address"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    disabled={updateEmployeeMutation.isPending}
                    rows={2}
                  />
                </div>
                
                {/* Bagian Jam Kerja */}
                <div className="space-y-4 rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <Label className="text-base font-medium">Jadwal Kerja</Label>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-workingHoursStart">Waktu Mulai</Label>
                      <Input 
                        id="edit-workingHoursStart" 
                        type="time" 
                        value={editFormData.workingHoursStart}
                        onChange={(e) => setEditFormData({ ...editFormData, workingHoursStart: e.target.value })}
                        disabled={updateEmployeeMutation.isPending}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-workingHoursEnd">Waktu Selesai</Label>
                      <Input 
                        id="edit-workingHoursEnd" 
                        type="time" 
                        value={editFormData.workingHoursEnd}
                        onChange={(e) => setEditFormData({ ...editFormData, workingHoursEnd: e.target.value })}
                        disabled={updateEmployeeMutation.isPending}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label id="edit-working-days-label">Hari kerja</Label>
                    <WorkingDaysPicker
                      labelledBy="edit-working-days-label"
                      value={editFormData.workingDays}
                      disabled={updateEmployeeMutation.isPending}
                      onChange={(days) => setEditFormData({ ...editFormData, workingDays: days })}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={updateEmployeeMutation.isPending}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleEditSubmit}
                    disabled={updateEmployeeMutation.isPending}
                  >
                    {updateEmployeeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan perubahan
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
};

export default Onboarding;
