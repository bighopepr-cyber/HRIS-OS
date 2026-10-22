import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Target, Plus, Loader2, Trash2, Edit2, Calendar } from "lucide-react";
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, Goal } from "@/hooks/usePerformance";
import { statusBadgeClass, formatStatus } from "@/lib/statusStyles";
import { priorityBadgeClass, formatPriority, formatDueDate } from "./kpiStyles";

interface GoalsManagerProps {
  employeeId: string;
}

export function GoalsManager({ employeeId }: GoalsManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    title: "", description: "", category: "performance", customCategory: "", priority: "medium", due_date: "",
  });

  const { data: goals, isLoading } = useGoals(employeeId);
  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal();
  const deleteMutation = useDeleteGoal();

  const resetForm = () => {
    setFormData({ title: "", description: "", category: "performance", customCategory: "", priority: "medium", due_date: "" });
    setEditingGoal(null);
  };

  const openCreateDialog = () => { resetForm(); setIsDialogOpen(true); };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    const predefined = ["performance", "productivity", "quality", "leadership", "development"];
    const isCustom = goal.category && !predefined.includes(goal.category);
    setFormData({
      title: goal.title, description: goal.description || "",
      category: isCustom ? "other" : goal.category, customCategory: isCustom ? goal.category : "",
      priority: goal.priority, due_date: goal.due_date || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;
    const finalCategory = formData.category === "other" ? formData.customCategory.trim() || "other" : formData.category;

    if (editingGoal) {
      await updateMutation.mutateAsync({
        id: editingGoal.id, employeeId, title: formData.title,
        description: formData.description || null, category: finalCategory,
        priority: formData.priority, due_date: formData.due_date || null,
      });
    } else {
      await createMutation.mutateAsync({
        employee_id: employeeId, title: formData.title,
        description: formData.description || undefined, category: finalCategory,
        priority: formData.priority, due_date: formData.due_date || undefined,
      });
    }
    setIsDialogOpen(false);
    resetForm();
  };

  if (isLoading) {
    return <Card><CardContent className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent></Card>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
<CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />KPI</CardTitle>
<CardDescription>Indikator kinerja utama Anda. Penilaian ditambahkan selama siklus peninjauan.</CardDescription>
          </div>
          <Button onClick={openCreateDialog} className="w-full shrink-0 sm:w-auto"><Plus className="h-4 w-4 mr-2" />Tambah KPI</Button>
        </CardHeader>
        <CardContent>
          {goals && goals.length > 0 ? (
            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <h3 className="break-words font-medium">{goal.title}</h3>
                      {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8" aria-label={`Sunting KPI ${goal.title}`} title="Sunting KPI" onClick={() => openEditDialog(goal)}><Edit2 className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8" aria-label={`Hapus KPI ${goal.title}`} title="Hapus KPI"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Hapus KPI</AlertDialogTitle><AlertDialogDescription>Anda yakin? Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate({ id: goal.id, employeeId })}>Hapus</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={statusBadgeClass(goal.status)}>{formatStatus(goal.status)}</Badge>
                    <Badge variant="outline" className={priorityBadgeClass(goal.priority)}>{formatPriority(goal.priority)}</Badge>
                    {goal.due_date && <Badge variant="outline" className="gap-1 font-normal"><Calendar className="h-3 w-3" aria-hidden="true" />{formatDueDate(goal.due_date)}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="mx-auto h-8 w-8 mb-2 opacity-50" />
<p>Belum ada KPI</p>
<p className="text-sm">Buat KPI pertama Anda untuk mulai melacak kinerja</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingGoal ? "Sunting KPI" : "Buat KPI baru"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label htmlFor="kpi-title">Judul</Label><Input id="kpi-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Masukkan judul KPI" /></div>
            <div className="space-y-2"><Label htmlFor="kpi-description">Deskripsi</Label><Textarea id="kpi-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Jelaskan KPI Anda..." rows={3} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="kpi-category">Kategori</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v, customCategory: v === "other" ? formData.customCategory : "" })}>
                  <SelectTrigger id="kpi-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
<SelectItem value="performance">Kinerja</SelectItem><SelectItem value="productivity">Produktivitas</SelectItem>
<SelectItem value="quality">Kualitas</SelectItem><SelectItem value="leadership">Kepemimpinan</SelectItem>
<SelectItem value="development">Pengembangan</SelectItem><SelectItem value="other">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
                {formData.category === "other" && <Input value={formData.customCategory} onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })} placeholder="Masukkan kategori kustom" aria-label="Kategori kustom" className="mt-2" />}
              </div>
              <div className="space-y-2">
                <Label htmlFor="kpi-priority">Prioritas</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger id="kpi-priority"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="low">Rendah</SelectItem><SelectItem value="medium">Sedang</SelectItem><SelectItem value="high">Tinggi</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label htmlFor="kpi-due-date">Tanggal jatuh tempo (opsional)</Label><Input id="kpi-due-date" type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={!formData.title.trim() || createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingGoal ? "Simpan perubahan" : "Buat KPI"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
