import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ArrowRight, Check, Download, Loader2, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import {
  downloadRevisionLetter,
  useDecideSalaryRevision,
  useEmployeeSalaryRevisions,
  useIsOwnEmployee,
  useLegacySalaryHistory,
  usePendingSalaryRevisions,
  type SalaryRevision,
} from "@/hooks/useSalaryRevisions";
import { formatCurrency } from "@/lib/currency";
import {
  REVISION_STATUS_LABELS,
  formatPercent,
  grossOf,
  netOf,
  percentChange,
  revisionStatusTone,
  revisionTypeLabel,
  toComponents,
  type SalaryComponents,
} from "@/lib/salaryRevision";
import { statusBadgeClass } from "@/lib/statusStyles";
import { SalaryRevisionDialog } from "./SalaryRevisionDialog";

const shortDate = (iso: string) => format(parseISO(iso.slice(0, 10)), "MMM d, yyyy");

type DecideAction = { revision: SalaryRevision; action: "approve" | "reject" | "cancel" } | null;

function useLetterDownload() {
  const [busyId, setBusyId] = useState<string | null>(null);
  const download = async (revision: SalaryRevision) => {
    setBusyId(revision.id);
    try {
      await downloadRevisionLetter(revision);
    } catch {
      toast.error("Couldn't create the revision letter");
    } finally {
        setBusyId(null);
      }
    };
    return { busyId, download };
  }
  
  // ---------------------------------------------------------------------------
  // Satu revisi
  // ---------------------------------------------------------------------------

interface RevisionRowProps {
  revision: SalaryRevision;
  /** Show whose revision it is (lists across people). */
  showEmployee?: boolean;
  canManage: boolean;
  onDecide: (action: NonNullable<DecideAction>) => void;
  onDownload: (revision: SalaryRevision) => void;
  downloading: boolean;
  /** Hide internal details (reason, decision notes) from the employee's own view. */
  employeeView?: boolean;
}

function RevisionRow({ revision, showEmployee, canManage, onDecide, onDownload, downloading, employeeView }: RevisionRowProps) {
  const { user } = useAuth();
  const before = revision.previous;
  const oldGross = before ? grossOf(before) : null;
  const newGross = grossOf(revision.components);
  const change = oldGross !== null ? percentChange(oldGross, newGross) : null;
  const isOpen = revision.status === "pending_approval" || revision.status === "scheduled";
  const proposedByMe = !!user?.id && revision.createdBy === user.id;
  const isMySalary = !!user?.id && revision.employeeUserId === user.id;
  const title = showEmployee ? revision.employeeName : revisionTypeLabel(revision.revisionType);

  return (
    <li className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">
            {showEmployee && `${revisionTypeLabel(revision.revisionType)} · `}
            Berlaku {shortDate(revision.effectiveFrom)}
            {revision.reviewPeriod && ` · Ulasan: ${revision.reviewPeriod}`}
          </p>
        </div>
        <Badge variant="outline" className={statusBadgeClass(revisionStatusTone(revision.status))}>
          {revision.status === "scheduled" && employeeView ? "Mendatang" : REVISION_STATUS_LABELS[revision.status]}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="text-muted-foreground">Gaji kotor bulanan</span>
        {oldGross !== null && (
          <>
            <span className="text-foreground">{formatCurrency(oldGross)}</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-label="ke" />
          </>
        )}
        <span className="font-semibold text-foreground">{formatCurrency(newGross)}</span>
        {change !== null && (
          <span className={change > 0 ? "text-emerald-700 dark:text-emerald-400" : change < 0 ? "text-destructive" : "text-muted-foreground"}>
            ({formatPercent(change)})
          </span>
        )}
        <span className="text-muted-foreground">· Bersih {formatCurrency(netOf(revision.components))}</span>
      </div>

      {revision.status === "applied" && revision.adjustmentAmount !== 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          {revision.adjustmentAmount > 0 ? "Tunggakan" : "Prorata"} sebesar {formatCurrency(Math.abs(revision.adjustmentAmount))}{" "}
          {revision.adjustmentAmount > 0 ? "ditambahkan ke" : "dikurangi dari"} penggajian berikutnya.
        </p>
      )}
      {!employeeView && revision.reason && <p className="mt-2 text-sm text-foreground">{revision.reason}</p>}
      {!employeeView && revision.status === "rejected" && revision.decisionNotes && (
        <p className="mt-2 text-sm text-destructive">Ditolak: {revision.decisionNotes}</p>
      )}
      {!employeeView && revision.status === "pending_approval" && (proposedByMe || isMySalary) && (
        <p className="mt-2 text-xs text-muted-foreground">
          {isMySalary ? "Ini adalah gaji Anda, jadi" : "Anda mengusulkan ini, jadi"} admin penggajian lain harus menyetujuinya.
        </p>
      )}

      <div className="mt-3 flex flex-wrap justify-end gap-2 empty:hidden">
        {revision.status === "applied" && (
          <Button type="button" variant="outline" size="sm" onClick={() => onDownload(revision)} disabled={downloading}>
            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Surat revisi
          </Button>
        )}
        {canManage && isOpen && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onDecide({ revision, action: "cancel" })}>
            Batalkan revisi
          </Button>
        )}
        {canManage && revision.status === "pending_approval" && !proposedByMe && !isMySalary && (
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => onDecide({ revision, action: "reject" })}>
              <X className="mr-2 h-4 w-4" />
              Tolak
            </Button>
            <Button type="button" size="sm" onClick={() => onDecide({ revision, action: "approve" })}>
              <Check className="mr-2 h-4 w-4" />
              Setujui
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Setujui / tolak / batalkan konfirmasi
// ---------------------------------------------------------------------------

function DecideDialog({ pending, onClose }: { pending: DecideAction; onClose: () => void }) {
  const decide = useDecideSalaryRevision();
  const [notes, setNotes] = useState("");
  const action = pending?.action;
  const revision = pending?.revision;

  const copy = {
    approve: {
      title: "Setujui revisi gaji ini?",
      body: "Berlaku pada tanggal efektifnya. Jika tanggal tersebut telah lewat, akan diterapkan sekarang.",
      button: "Setujui",
    },
    reject: { title: "Tolak revisi gaji ini?", body: "Gaji akan tetap seperti semula.", button: "Tolak" },
    cancel: {
      title: "Batalkan revisi gaji ini?",
      body: "Tidak akan diterapkan. Untuk mengubah jumlah atau tanggal, batalkan dan buat yang baru.",
      button: "Batalkan revisi",
    },
  } as const;

  const submit = () => {
    if (!revision || !action) return;
    const status = action === "approve" ? "scheduled" : action === "reject" ? "rejected" : "cancelled";
    decide.mutate(
      { id: revision.id, status, notes },
      {
        onSuccess: ({ revision: updated, emailError }) => {
          const name = revision.employeeName || "Karyawan";
          if (action === "approve") {
            toast.success(
              updated?.status === "applied" ? `Gaji ${name} telah direvisi` : `Disetujui. Berlaku pada ${shortDate(revision.effectiveFrom)}.`,
            );
          } else {
            toast.success(action === "reject" ? "Revisi ditolak" : "Revisi dibatalkan");
          }
          if (emailError) toast.warning(emailError);
          setNotes("");
          onClose();
        },
        onError: (error: Error) => toast.error("Tidak dapat memperbarui revisi", { description: error.message }),
      },
    );
  };

  return (
    <Dialog open={!!pending} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{action ? copy[action].title : ""}</DialogTitle>
          <DialogDescription>
            {revision?.employeeName ? `${revision.employeeName}, efektif ${revision ? shortDate(revision.effectiveFrom) : ""}. ` : ""}
            {action ? copy[action].body : ""}
          </DialogDescription>
        </DialogHeader>
        {action === "reject" && (
          <div className="space-y-2">
            <Label htmlFor="revision-reject-notes">Alasan</Label>
            <Textarea
              id="revision-reject-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dibagikan kepada yang mengusulkan (opsional)"
              maxLength={2000}
              rows={3}
            />
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Kembali
          </Button>
          <Button
            type="button"
            variant={action === "approve" ? "default" : "destructive"}
            onClick={submit}
            disabled={decide.isPending}
          >
            {decide.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {action ? copy[action].button : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// One person's salary: current pay, Revise, open and past revisions
// ---------------------------------------------------------------------------

interface SalaryRevisionsPanelProps {
  employeeId: string;
  employeeName: string;
  structure: Partial<Record<keyof SalaryComponents, unknown>> & { effective_from?: string | null };
}

export function SalaryRevisionsPanel({ employeeId, employeeName, structure }: SalaryRevisionsPanelProps) {
  const { can, isAdmin } = usePermissions();
  const isOwn = useIsOwnEmployee(employeeId);
  // Only admins may revise their own pay (and it's recorded)
  const canManage = can("payroll", "manage");
  const canRevise = canManage && (!isOwn || isAdmin);
  const { data: revisions = [], isLoading } = useEmployeeSalaryRevisions(employeeId);
  const { data: history = [] } = useLegacySalaryHistory(employeeId);
  const [reviseOpen, setReviseOpen] = useState(false);
  const [deciding, setDeciding] = useState<DecideAction>(null);
  const { busyId, download } = useLetterDownload();

  const current = toComponents(structure);
  const open = revisions.filter((r) => r.status === "pending_approval" || r.status === "scheduled");
  const past = revisions.filter((r) => r.status !== "pending_approval" && r.status !== "scheduled");
  // Changes made before salary revisions existed have no reason recorded
  const legacy = history.filter((h) => !h.change_reason);

  const rowProps = { canManage, onDecide: setDeciding, onDownload: download };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Gaji bulanan saat ini</p>
            <p className="text-2xl font-semibold text-foreground">{formatCurrency(grossOf(current))}</p>
            <p className="text-xs text-muted-foreground">
              Bersih {formatCurrency(netOf(current))} · Gaji kotor tahunan {formatCurrency(grossOf(current) * 12)}
              {structure.effective_from && ` · Sejak ${shortDate(structure.effective_from)}`}
            </p>
          </div>
          {canRevise && (
            <Button type="button" onClick={() => setReviseOpen(true)} disabled={open.length > 0}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Revisi gaji
            </Button>
          )}
        </div>
        {canRevise && open.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Sudah ada revisi dalam perjalanan. Batalkan untuk membuat yang berbeda.
          </p>
        )}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          {[
            ["Gaji pokok", current.basic_salary],
            ["Tunjangan perumahan", current.hra],
            ["Transportasi", current.transport_allowance],
            ["Kesehatan", current.medical_allowance],
            ["Lainnya", current.other_allowances],
            ["Pajak", -current.tax_deduction],
            ["BPJS/TK", -current.pf_deduction],
          ].map(([label, amount]) => (
            <div key={label as string}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-foreground">{formatCurrency(amount as number)}</dd>
            </div>
          ))}
        </dl>
      </div>

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <>
          {open.length > 0 && (
            <section className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Dalam proses</h4>
              <ul className="space-y-2">
                {open.map((r) => (
                  <RevisionRow key={r.id} revision={r} {...rowProps} downloading={busyId === r.id} />
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Riwayat revisi</h4>
            {past.length === 0 && legacy.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada revisi.</p>
            ) : (
              <ul className="space-y-2">
                {past.map((r) => (
                  <RevisionRow key={r.id} revision={r} {...rowProps} downloading={busyId === r.id} />
                ))}
                {legacy.map((h) => {
                  const c = toComponents(h);
                  return (
                    <li key={h.id} className="rounded-lg border border-dashed border-border p-4 text-sm">
                      <p className="text-foreground">
                        Gaji sebelumnya: {formatCurrency(grossOf(c))} kotor, {formatCurrency(netOf(c))} bersih
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {shortDate(h.effective_from)}
                        {h.effective_to ? ` – ${shortDate(h.effective_to)}` : ""} · diubah sebelum sistem revisi gaji
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}

      <SalaryRevisionDialog
        employee={reviseOpen ? { id: employeeId, name: employeeName } : null}
        current={current}
        onOpenChange={setReviseOpen}
      />
      <DecideDialog pending={deciding} onClose={() => setDeciding(null)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payroll page: revisions waiting for approval
// ---------------------------------------------------------------------------

export function PendingSalaryRevisions() {
  const { can } = usePermissions();
  const canManage = can("payroll", "manage");
  const { data: pending = [] } = usePendingSalaryRevisions(canManage);
  const [deciding, setDeciding] = useState<DecideAction>(null);

  if (!canManage || pending.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Revisi gaji menunggu persetujuan</CardTitle>
        <CardDescription>
          Seseorang selain yang mengusulkan harus menyetujui. Tidak ada yang menyetujui gaji sendiri.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {pending.map((r) => (
            <RevisionRow
              key={r.id}
              revision={r}
              showEmployee
              canManage={canManage}
              onDecide={setDeciding}
              onDownload={() => undefined}
              downloading={false}
            />
          ))}
        </ul>
      </CardContent>
      <DecideDialog pending={deciding} onClose={() => setDeciding(null)} />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Profile: the employee's own compensation and revision letters
// ---------------------------------------------------------------------------

export function MyCompensation({ employeeId }: { employeeId: string }) {
  const { data: revisions = [], isLoading } = useEmployeeSalaryRevisions(employeeId);
  // Same query (and cache entry) as the payslip viewer
  const { data: structure } = useQuery({
    queryKey: ["my-salary-structure", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salary_structures")
        .select("*")
        .eq("employee_id", employeeId)
        .order("effective_from", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });
  const { busyId, download } = useLetterDownload();

  if (!structure && revisions.length === 0) return null;
  const current = structure ? toComponents(structure) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Kompensasi</CardTitle>
        <CardDescription>Gaji bulanan Anda saat ini dan surat revisi.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {current && (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/50 p-3">
              <dt className="text-xs text-muted-foreground">Gaji kotor bulanan</dt>
              <dd className="text-lg font-semibold text-foreground">{formatCurrency(grossOf(current))}</dd>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <dt className="text-xs text-muted-foreground">Take-home bulanan</dt>
              <dd className="text-lg font-semibold text-foreground">{formatCurrency(netOf(current))}</dd>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <dt className="text-xs text-muted-foreground">Gaji kotor tahunan</dt>
              <dd className="text-lg font-semibold text-foreground">{formatCurrency(grossOf(current) * 12)}</dd>
            </div>
          </dl>
        )}
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : revisions.length > 0 ? (
          <ul className="space-y-2">
            {revisions.map((r) => (
              <RevisionRow
                key={r.id}
                revision={r}
                canManage={false}
                onDecide={() => undefined}
                onDownload={download}
                downloading={busyId === r.id}
                employeeView
              />
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
