export function toDatePart(dateStr: string): string {
  return dateStr.split('T')[0]
}
