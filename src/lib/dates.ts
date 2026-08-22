export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function effectiveRenewalDay(year: number, month: number, renewalDay: number) {
  return Math.min(renewalDay, daysInMonth(year, month));
}

export function issueDateForPeriod(period: string, renewalDay: number) {
  const [year, month] = period.split("-").map(Number);
  const day = effectiveRenewalDay(year, month, renewalDay);
  return `${period}-${String(day).padStart(2, "0")}`;
}

export function currentPeriod(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
