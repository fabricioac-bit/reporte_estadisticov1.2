export function formatNumber(val: number): string {
  return new Intl.NumberFormat('es-PE').format(val);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}
