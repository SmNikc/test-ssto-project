const PRIMARY_RECIPIENT = 'od_smrcc@morflot.ru';

function normalize(list: string | string[] | undefined): string[] {
  if (!list) return [];
  if (Array.isArray(list)) return list.filter(Boolean).map((v) => v.trim()).filter(Boolean);
  return list.split(/[;,]/).map((v) => v.trim()).filter(Boolean);
}

export function buildRecipientList(to: string | string[], cc: string | string[] = []): string[] {
  const recipients = new Set<string>();
  for (const item of [...normalize(to), ...normalize(cc)]) {
    if (!item) continue;
    recipients.add(item.toLowerCase());
  }
  recipients.add(PRIMARY_RECIPIENT);
  return Array.from(recipients);
}

export function mustIncludePrimary(to: string | string[]): boolean {
  const list = normalize(to);
  return list.map((v) => v.toLowerCase()).includes(PRIMARY_RECIPIENT);
}

export const PRIMARY_SSTO_RECIPIENT = PRIMARY_RECIPIENT;
