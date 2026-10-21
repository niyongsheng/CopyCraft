/** 展示格式：XXXXX-XXXXX-XXXXX-XXXXX-XXXXX（复制时仍用无分隔规范串）。 */
export function formatFingerprint(fingerprint: string): string {
  return fingerprint.match(/.{1,5}/g)?.join('-') ?? fingerprint;
}

/** unix 秒 → 本地日期（YYYY/MM/DD）；null 返回空串。 */
export function formatLicenseDate(unixSeconds: number | null): string {
  if (unixSeconds == null) return '';
  const date = new Date(unixSeconds * 1000);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}
