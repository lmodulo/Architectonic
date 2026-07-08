export function calcNextDate(from: Date, frequency: string): Date {
  const d = new Date(from);
  switch (frequency) {
    case 'weekly':    d.setDate(d.getDate() + 7);         break;
    case 'biweekly':  d.setDate(d.getDate() + 14);        break;
    case 'monthly':   d.setMonth(d.getMonth() + 1);       break;
    case 'quarterly': d.setMonth(d.getMonth() + 3);       break;
    case 'yearly':    d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}
