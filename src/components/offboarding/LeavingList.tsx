import { useState } from "react";
import { Link } from "react-router-dom";
import { differenceInCalendarDays, format, formatDistanceToNow, parseISO } from "date-fns";
import {
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  DoorOpen,
  ListChecks,
  Loader2,
  Mail,
  Send,
  UserMinus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toneClass } from "@/lib/statusStyles";
import {
  type ChecklistSection,
  defaultRecipientIds,
  type EmployeeExit,
  type ExitRecipients,
  exitReasonLabel,
  sendChecklistEmail,
  sendDecisionEmail,
  useCompleteExit,
  useEmployeeExits,
  useOffboardingChecklist,
  useUpdateExit,
} from "@/hooks/useOffboarding";
import { ChecklistTemplateDialog } from "./ChecklistTemplateDialog";
import { OffboardingEmailFields } from "./OffboardingEmailFields";

const fmt = (date: string) => format(parseISO(date), "MMM d, yyyy");
const nameOf = (x: EmployeeExit) => (x.employee ? `${x.employee.first_name} ${x.employee.last_name}` : "Employee");
const initialsOf = (x: EmployeeExit) =>
  x.employee ? `${x.employee.first_name[0] ?? ""}${x.employee.last_name[0] ?? ""}`.toUpperCase() : "?";
const recipientCount = (x: EmployeeExit) => x.notify_employee_ids.length + x.notify_emails.length;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function lastDayText(lastWorkingDay: string) {
  const days = differenceInCalendarDays(parseISO(lastWorkingDay), new Date());
  if (days > 1) return { text: `in ${days} days`, tone: "info" as const };
  if (days === 1) return { text: "tomorrow", tone: "warning" as const };
  if (days === 0) return { text: "today", tone: "warning" as const };
  return { text: "passed, completes overnight", tone: "danger" as const };
}

function PersonHeader({ exit }: { exit: EmployeeExit }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {initialsOf(exit)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">{nameOf(exit)}</p>
        <p className="truncate text-sm text-muted-foreground">
          {[exit.employee?.designation, exit.employee?.department?.name].filter(Boolean).join(" · ") || "No role set"}
        </p>
      </div>
    </div>
  );
}

function ChecklistView({ sections }: { sections: ChecklistSection[] }) {
  if (sections.length === 0) {
    return <p className="text-sm text-muted-foreground">Templat daftar periksa kosong.</p>;
  }
  return (
    <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
      {sections.map((s) => (
        <div key={s.name}>
          <p className="mb-1.5 text-sm font-semibold text-primary">{s.name}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
            {s.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

interface LeavingListProps {
  canManage: boolean;
}

export function LeavingList({ canManage }: LeavingListProps) {
  const { data: exits = [], isLoading } = useEmployeeExits();
  const { data: template = [] } = useOffboardingChecklist();
  const updateExit = useUpdateExit();
  const completeExit = useCompleteExit();

  const [templateOpen, setTemplateOpen] = useState(false);
  const [approving, setApproving] = useState<EmployeeExit | null>(null);
  const [approveDate, setSetujuiDate] = useState("");
  const [declining, setDeclining] = useState<EmployeeExit | null>(null);
  const [declineNote, setTolakNote] = useState("");
  const [changingDate, setChangingDate] = useState<EmployeeExit | null>(null);
  const [newDate, setNewDate] = useState("");
  const [cancelling, setCancelling] = useState<EmployeeExit | null>(null);
  const [completing, setCompleting] = useState<EmployeeExit | null>(null);
  const [emailing, setEmailing] = useState<EmployeeExit | null>(null);
  const [recipients, setRecipients] = useState<ExitRecipients>({ employeeIds: [], emails: [] });
  const [emailNote, setEmailNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const requested = exits.filter((x) => x.status === "requested");
  const leaving = exits.filter((x) => x.status === "in_progress");
  const left = exits
    .filter((x) => x.status === "completed")
    .sort((a, b) => b.last_working_day.localeCompare(a.last_working_day));

  const fail = (title: string) => (error: Error) => toast.error(title, { description: error.message });

  const openSetujui = (exit: EmployeeExit) => {
    setApproving(exit);
    setSetujuiDate(exit.last_working_day);
    setEmailNote("");
    setRecipients({ employeeIds: [], emails: [] });
    defaultRecipientIds(exit.employee_id)
      .then((ids) => setRecipients({ employeeIds: ids, emails: [] }))
      .catch(() => undefined);
  };

  const openEmail = (exit: EmployeeExit) => {
    setEmailing(exit);
    setEmailNote(exit.email_note ?? "");
    if (recipientCount(exit) > 0) {
      setRecipients({ employeeIds: exit.notify_employee_ids, emails: exit.notify_emails });
    } else {
      setRecipients({ employeeIds: [], emails: [] });
      defaultRecipientIds(exit.employee_id)
        .then((ids) => setRecipients({ employeeIds: ids, emails: [] }))
        .catch(() => undefined);
    }
  };

  const emailCount = recipients.employeeIds.length + recipients.emails.length;

  const approve = async () => {
    if (!approving || !approveDate) return;
    setBusy(true);
    try {
      await updateExit.mutateAsync({
        id: approving.id,
        status: "in_progress",
        lastWorkingDay: approveDate,
        recipients,
        emailNote,
      });
      const problems: string[] = [];
      await sendDecisionEmail(approving.id).catch((e: Error) => problems.push(`to ${nameOf(approving)}: ${e.message}`));
      let sent = 0;
      if (emailCount > 0) {
        await sendChecklistEmail(approving.id)
          .then((r) => (sent = r.sent))
          .catch((e: Error) => problems.push(`checklist: ${e.message}`));
      }
      if (problems.length) {
        toast.warning("Resignation approved, but some emails weren't sent", { description: problems.join(" · ") });
      } else {
        toast.success("Resignation approved", {
          description: `Hari terakhir bekerja ${fmt(approveDate)}. ${nameOf(approving)} was emailed${sent ? `, and the checklist went to ${plural(sent, "person", "people")}` : ""}.`,
        });
      }
      setApproving(null);
    } catch (e) {
      fail("Couldn't approve the resignation")(e as Error);
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    if (!declining) return;
    setBusy(true);
    try {
      await updateExit.mutateAsync({ id: declining.id, status: "declined", decisionNotes: declineNote });
      await sendDecisionEmail(declining.id).catch((e: Error) =>
        toast.warning("Tolakd, but the email wasn't sent", { description: e.message }),
      );
      toast.success("Resignation declined");
      setDeclining(null);
    } catch (e) {
      fail("Couldn't decline the resignation")(e as Error);
    } finally {
      setBusy(false);
    }
  };

  const sendEmail = async () => {
    if (!emailing) return;
    setBusy(true);
    try {
      await updateExit.mutateAsync({ id: emailing.id, recipients, emailNote });
      const { sent } = await sendChecklistEmail(emailing.id);
      toast.success(sent ? `Checklist emailed to ${plural(sent, "person", "people")}` : "Recipients saved; nobody to email");
      setEmailing(null);
    } catch (e) {
      fail("Couldn't send the email")(e as Error);
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {canManage && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Daftar Periksa Offboarding</p>
            <p className="text-sm text-muted-foreground">
              {template.length
                ? `${plural(template.length, "department", "departments")} · ${plural(template.reduce((n, s) => n + s.items.length, 0), "item", "items")}, emailed with every offboarding`
                : "Not set up yet"}
            </p>
          </div>
          <Button variant="outline" className="h-10 sm:h-9" onClick={() => setTemplateOpen(true)}>
            <ListChecks className="mr-2 h-4 w-4" aria-hidden="true" />
            Edit checklist
          </Button>
        </div>
      )}

      {requested.length > 0 && (
        <section aria-labelledby="resignations-heading" className="space-y-3">
          <h2 id="resignations-heading" className="text-sm font-semibold text-muted-foreground">
            Pengunduran Diri untuk Direviu
          </h2>
          <ul className="space-y-3">
            {requested.map((exit) => (
              <li key={exit.id}>
                <Card>
                  <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                    <PersonHeader exit={exit} />
                    <div className="space-y-1 text-sm md:w-64">
                      <p className="text-muted-foreground">Diajukan {fmt(exit.created_at.slice(0, 10))}</p>
                      <p className="font-medium text-foreground">Hari terakhir yang diusulkan: {fmt(exit.last_working_day)}</p>
                      {exit.notes && <p className="line-clamp-2 text-muted-foreground">“{exit.notes}”</p>}
                    </div>
                    {canManage && (
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <Button size="sm" className="h-10 sm:h-9" onClick={() => openSetujui(exit)}>
                          <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-10 sm:h-9"
                          onClick={() => {
                            setDeclining(exit);
                            setTolakNote("");
                          }}
                        >
                          <X className="mr-2 h-4 w-4" aria-hidden="true" />
                          Tolak
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="leaving-heading" className="space-y-3">
        <h2 id="leaving-heading" className="text-sm font-semibold text-muted-foreground">
Meninggal
        </h2>
        {leaving.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <DoorOpen className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-foreground">Tidak ada yang keluar</p>
                <p className="text-sm text-muted-foreground">
                  {canManage ? (
                    <>
                      Mulai offboarding dari baris seseorang di{" "}
                      <Link to="/employees" className="font-medium text-primary underline-offset-4 hover:underline">
                        Employees
                      </Link>
                      . Pengunduran diri muncul di sini untuk disetujui.
                    </>
                  ) : (
                    "Orang dengan offboarding yang sedang berlangsung muncul di sini."
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {leaving.map((exit) => {
              const due = lastDayText(exit.last_working_day);
              const canComplete = differenceInCalendarDays(parseISO(exit.last_working_day), new Date()) <= 0;
              const isOpen = open[exit.id] ?? false;
              const count = recipientCount(exit);
              return (
                <li key={exit.id} data-leaving>
                  <Card>
                    <CardContent className="space-y-4 p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <PersonHeader exit={exit} />
                        <div className="space-y-1 md:w-64">
                          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            Hari terakhir {fmt(exit.last_working_day)}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline" className={toneClass(due.tone)}>
                              {due.text}
                            </Badge>
                            <Badge variant="outline" className={toneClass("neutral")}>
                              {exitReasonLabel(exit.reason)}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-0.5 text-sm md:w-56">
                          <p className="flex items-center gap-1.5 font-medium text-foreground">
                            <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            {exit.notified_at ? `Dikirim ke ${plural(count, "person", "people")}` : "Daftar periksa belum dikirim email"}
                          </p>
                          <p className="text-muted-foreground">
                            {exit.notified_at
                              ? `${formatDistanceToNow(new Date(exit.notified_at), { addSuffix: true })}${exit.reminder_sent_at ? " · reminder sent" : " · reminder on the last day"}`
                              : canManage
                                ? "Pilih siapa yang mendapatkannya dan kirim"
                                : "Belum dikirim"}
                          </p>
                        </div>
                      </div>

                      <Collapsible open={isOpen} onOpenChange={(o) => setOpen((s) => ({ ...s, [exit.id]: o }))}>
                        <div className="flex flex-wrap items-center gap-2">
                          {canManage && (
                            <Button
                              size="sm"
                              variant={exit.notified_at ? "outline" : "default"}
                              className="h-10 sm:h-9"
                              onClick={() => openEmail(exit)}
                            >
                              <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                              {exit.notified_at ? "Kirim ulang email" : "Email daftar periksa"}
                            </Button>
                          )}
                          <CollapsibleTrigger asChild>
                            <Button size="sm" variant="outline" className="h-10 sm:h-9" aria-expanded={isOpen}>
                              <ChevronDown
                                className={cn("mr-2 h-4 w-4 transition-transform", isOpen && "rotate-180")}
                                aria-hidden="true"
                              />
                              {isOpen ? "Sembunyi daftar periksa" : "Tampilkan daftar periksa"}
                            </Button>
                          </CollapsibleTrigger>
                          {canManage && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-10 sm:h-9"
                                onClick={() => {
                                  setChangingDate(exit);
                                  setNewDate(exit.last_working_day);
                                }}
                              >
                                <CalendarClock className="mr-2 h-4 w-4" aria-hidden="true" />
                                Ubah hari terakhir
                              </Button>
                              {canComplete && (
                                <Button size="sm" className="h-10 sm:h-9" onClick={() => setCompleting(exit)}>
                                  <UserMinus className="mr-2 h-4 w-4" aria-hidden="true" />
Selesaikan sekarang
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-10 text-red-700 hover:bg-red-50 hover:text-red-800 sm:h-9"
                                onClick={() => setCancelling(exit)}
                              >
                                <X className="mr-2 h-4 w-4" aria-hidden="true" />
Batalkan offboarding
                              </Button>
                            </>
                          )}
                        </div>
                        <CollapsibleContent className="space-y-2 pt-4">
                          <p className="text-xs text-muted-foreground">
                            {exit.checklist ? "As emailed. Teams confirm by replying to the email." : "The current template; it's included when you email the checklist."}
                          </p>
                          <ChecklistView sections={exit.checklist?.sections ?? template} />
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {left.length > 0 && (
        <section aria-labelledby="left-heading">
          <h2 id="left-heading" className="mb-3 text-sm font-semibold text-muted-foreground">
            Kiri dalam 90 hari terakhir
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {left.map((exit) => (
              <li key={exit.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                <DoorOpen className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{nameOf(exit)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {exitReasonLabel(exit.reason)} · last day {fmt(exit.last_working_day)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ChecklistTemplateDialog open={templateOpen} onOpenChange={setTemplateOpen} />

      {/* Setujui resignation */}
      <Dialog open={!!approving} onOpenChange={(o) => !o && !busy && setApproving(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Setujui {approving ? nameOf(approving) : ""}'s resignation</DialogTitle>
            <DialogDescription>
              Konfirmasi hari terakhir bekerja. {approving?.employee?.first_name ?? "Mereka"} menerima email dengan tanggal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="approve-last-day">Hari terakhir bekerja</Label>
            <Input
              id="approve-last-day"
              type="date"
              value={approveDate}
              min={approving?.notice_date}
              onChange={(e) => setSetujuiDate(e.target.value)}
            />
          </div>
          {approving && (
            <OffboardingEmailFields
              idPrefix="approve"
              employeeId={approving.employee_id}
              reason="resignation"
              lastWorkingDay={approveDate}
              recipients={recipients}
              onRecipientsChange={setRecipients}
              note={emailNote}
              onNoteChange={setEmailNote}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproving(null)} disabled={busy}>
              Batalkan
            </Button>
            <Button disabled={!approveDate || busy} onClick={approve}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {emailCount > 0 ? "Setujui and email checklist" : "Setujui"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tolak resignation */}
      <Dialog open={!!declining} onOpenChange={(o) => !o && !busy && setDeclining(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak {declining ? nameOf(declining) : ""}'s resignation?</DialogTitle>
            <DialogDescription>Mereka tetap seperti sekarang. Catatan Anda dikirim email kepada mereka.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="decline-note">Catatan kepada {declining?.employee?.first_name ?? "them"}</Label>
            <Textarea
              id="decline-note"
              value={declineNote}
              onChange={(e) => setTolakNote(e.target.value)}
              placeholder="contoh. Mari kita bicara pada Senin"
              maxLength={2000}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclining(null)} disabled={busy}>
              Batalkan
            </Button>
            <Button variant="destructive" disabled={busy} onClick={decline}>
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email / resend checklist */}
      <Dialog open={!!emailing} onOpenChange={(o) => !o && !busy && setEmailing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {emailing?.notified_at ? "Kirim ulang" : "Email"} {emailing ? nameOf(emailing) : ""}'s daftar periksa offboarding
            </DialogTitle>
            <DialogDescription>
              Hari terakhir bekerja {emailing ? fmt(emailing.last_working_day) : ""}. A reminder goes to the same people on
              that day.
            </DialogDescription>
          </DialogHeader>
          {emailing && (
            <OffboardingEmailFields
              idPrefix="resend"
              employeeId={emailing.employee_id}
              reason={emailing.reason}
              lastWorkingDay={emailing.last_working_day}
              recipients={recipients}
              onRecipientsChange={setRecipients}
              note={emailNote}
              onNoteChange={setEmailNote}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailing(null)} disabled={busy}>
              Batalkan
            </Button>
            <Button onClick={sendEmail} disabled={busy || emailCount === 0}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" aria-hidden="true" />}
              Kirim email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change last working day */}
      <Dialog open={!!changingDate} onOpenChange={(o) => !o && setChangingDate(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah {changingDate ? nameOf(changingDate) : ""}'s hari terakhir</DialogTitle>
            <DialogDescription>
              Gaji payroll untuk bulan akhir mereka akan dihitung proporsional hingga tanggal ini. Kirim ulang email jika tim harus mengetahuinya.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="change-last-day">Hari terakhir bekerja</Label>
            <Input
              id="change-last-day"
              type="date"
              value={newDate}
              min={changingDate?.notice_date}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangingDate(null)}>
              Batalkan
            </Button>
            <Button
              disabled={!newDate || updateExit.isPending}
              onClick={() =>
                changingDate &&
                updateExit.mutate(
                  { id: changingDate.id, lastWorkingDay: newDate },
                  {
                    onSuccess: () => {
                      toast.success("Hari terakhir bekerja updated", { description: fmt(newDate) });
                      setChangingDate(null);
                    },
                    onError: fail("Couldn't change the date"),
                  },
                )
              }
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batalkan offboarding */}
      <AlertDialog open={!!cancelling} onOpenChange={(o) => !o && setCancelling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan {cancelling ? nameOf(cancelling) : ""}'s offboarding?</AlertDialogTitle>
            <AlertDialogDescription>
              Mereka tetap sebagai karyawan aktif dan tidak ada pengingat yang dikirim. Mereka diberitahu di aplikasi. Jika daftar periksa
            telah dikirim email, beri tahu tim-tim tersebut.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tetapkan offboarding</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                cancelling &&
                updateExit.mutate(
                  { id: cancelling.id, status: "cancelled" },
                  {
                    onSuccess: () => toast.success("Offboarding cancelled"),
                    onError: fail("Couldn't cancel the offboarding"),
                  },
                )
              }
            >
              Batalkan offboarding
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete now */}
      <AlertDialog open={!!completing} onOpenChange={(o) => !o && setCompleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Selesaikan {completing ? nameOf(completing) : ""}'s offboarding sekarang?</AlertDialogTitle>
            <AlertDialogDescription>
              Mereka ditandai sebagai offboarded, masuk mereka diblokir dan cuti yang tertunda dibatalkan. Ini sebaliknya
                terjadi secara otomatis pagi hari setelah hari terakhir mereka bekerja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
              <AlertDialogCancel>Belum lagi</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                completing &&
                completeExit.mutate(completing.id, {
                  onSuccess: () => toast.success(`${nameOf(completing)} has been offboarded`),
                  onError: fail("Couldn't complete the offboarding"),
                })
              }
            >
              Selesaikan offboarding
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
