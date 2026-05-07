export function formatRelativeDeadline(iso: string | null): string {
  if (!iso) return '마감일 미상';
  const end = new Date(iso).getTime();
  const now = Date.now();
  const diff = end - now;
  if (Number.isNaN(end)) return '마감일 미상';
  if (diff <= 0) return '마감';
  const day = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (day >= 7) return `D-${day}`;
  if (day >= 1) return `${day}일 남음`;
  const hour = Math.floor(diff / (60 * 60 * 1000));
  return `${hour}시간 남음`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
