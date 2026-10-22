import { format } from "date-fns";

/**
 * Pembantu perhitungan penggajian murni, terpisah dari Supabase/React sehingga dapat diuji unit.
 * Disalin di supabase/functions/generate-monthly-payroll/index.ts
 * (Deno tidak dapat mengimpor dari src/) — jaga agar keduanya tetap sinkron.
 */

export const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5];

export interface HolidayRow {
  event_date: string;
  end_date: string | null;
}

export interface SalaryComponents {
  basic_salary: number | string | null;
  hra?: number | string | null;
  transport_allowance?: number | string | null;
  medical_allowance?: number | string | null;
  other_allowances?: number | string | null;
  tax_deduction?: number | string | null;
  pf_deduction?: number | string | null;
}

export interface PayrollAmounts {
  basic_salary: number;
  total_allowances: number;
  total_deductions: number;
  net_salary: number;
}

/** Memperluas baris hari libur (bisa multi-hari) menjadi set string "yyyy-MM-dd", dipotong ke [monthStart, monthEnd]. */
export function buildHolidaySet(holidays: HolidayRow[], monthStart: Date, monthEnd: Date): Set<string> {
  const set = new Set<string>();
  holidays.forEach((h) => {
    const hStart = new Date(`${h.event_date}T00:00:00`);
    const hEnd = h.end_date ? new Date(`${h.end_date}T00:00:00`) : hStart;
    const rangeStart = hStart < monthStart ? monthStart : hStart;
    const rangeEnd = hEnd > monthEnd ? monthEnd : hEnd;
    if (rangeStart > rangeEnd) return;
    for (const cur = new Date(rangeStart); cur <= rangeEnd; cur.setDate(cur.getDate() + 1)) {
      set.add(format(cur, "yyyy-MM-dd"));
    }
  });
  return set;
}

/** Menghitung hari dalam [start, end] (inklusif) yang jatuh pada salah satu workingDays dan bukan hari libur. */
export function countWorkingDays(start: Date, end: Date, workingDays: number[], holidaySet: Set<string>): number {
  let count = 0;
  for (const cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
    if (workingDays.includes(cur.getDay()) && !holidaySet.has(format(cur, "yyyy-MM-dd"))) {
      count++;
    }
  }
  return count;
}

/** Kembali ke Senin–Jumat jika karyawan tidak memiliki konfigurasi hari kerja. */
export function resolveWorkingDays(workingDays: number[] | null | undefined): number[] {
  return workingDays && workingDays.length > 0 ? workingDays : DEFAULT_WORKING_DAYS;
}

/**
 * Fraksi gaji bulan yang diperoleh karyawan: hari kerja saat bekerja /
 * hari kerja dalam bulan. Nilainya 1 kecuali bergabung setelah tanggal 1 atau
 * hari kerja terakhir (exitDate) jatuh sebelum akhir bulan.
 * Tanggal berupa string "yyyy-MM-dd".
 */
export function getProrationRatio(
  hireDate: string | null | undefined,
  monthStart: Date,
  monthEnd: Date,
  workingDays: number[],
  holidaySet: Set<string>,
  exitDate?: string | null
): number {
  const hire = hireDate ? new Date(`${hireDate}T00:00:00`) : null;
  const exit = exitDate ? new Date(`${exitDate}T00:00:00`) : null;
  const from = hire && hire > monthStart ? hire : monthStart;
  const to = exit && exit < monthEnd ? exit : monthEnd;
  if (from.getTime() === monthStart.getTime() && to.getTime() === monthEnd.getTime()) return 1;
  if (to < from) return 0;
  const totalWorkingDaysInMonth = countWorkingDays(monthStart, monthEnd, workingDays, holidaySet);
  const workedDays = countWorkingDays(from, to, workingDays, holidaySet);
  return totalWorkingDaysInMonth > 0 ? workedDays / totalWorkingDaysInMonth : 1;
}

/**
 * Apakah seseorang dibayar untuk bulan tersebut: bergabung paling lambat di hari terakhir bulan
 * dan tidak keluar sebelum hari pertama bulan.
 */
export function isEmployedDuringMonth(
  hireDate: string | null | undefined,
  exitDate: string | null | undefined,
  monthStartStr: string,
  monthEndStr: string
): boolean {
  return (!hireDate || hireDate <= monthEndStr) && (!exitDate || exitDate >= monthStartStr);
}

/** Menerapkan rasio pro-rata pada gaji pokok, tunjangan, dan potongan serta menghitung gaji bersih. */
export function calculatePayrollAmounts(salary: SalaryComponents, ratio: number): PayrollAmounts {
  const totalAllowances =
    Number(salary.hra || 0) +
    Number(salary.transport_allowance || 0) +
    Number(salary.medical_allowance || 0) +
    Number(salary.other_allowances || 0);

  const totalDeductions = Number(salary.tax_deduction || 0) + Number(salary.pf_deduction || 0);

  const basicSalary = Number(salary.basic_salary || 0) * ratio;
  const proratedAllowances = totalAllowances * ratio;
  const proratedDeductions = totalDeductions * ratio;

  return {
    basic_salary: basicSalary,
    total_allowances: proratedAllowances,
    total_deductions: proratedDeductions,
    net_salary: basicSalary + proratedAllowances - proratedDeductions,
  };
}

export interface PayrollComponents {
  hra: number;
  transport_allowance: number;
  medical_allowance: number;
  other_allowances: number;
  tax_deduction: number;
  pf_deduction: number;
}

/**
 * Komponen gaji untuk satu catatan penggajian, diproratakan seperti totalnya.
 * Disimpan pada catatan sehingga revisi gaji di kemudian hari tidak mengubah slip gaji lama.
 */
export function prorateComponents(salary: SalaryComponents, ratio: number): PayrollComponents {
  const part = (value: number | string | null | undefined) => Math.round(Number(value || 0) * ratio * 100) / 100;
  return {
    hra: part(salary.hra),
    transport_allowance: part(salary.transport_allowance),
    medical_allowance: part(salary.medical_allowance),
    other_allowances: part(salary.other_allowances),
    tax_deduction: part(salary.tax_deduction),
    pf_deduction: part(salary.pf_deduction),
  };
}
