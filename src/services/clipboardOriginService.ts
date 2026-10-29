export interface OriginTokenPayload {
  accountEmail?: string;
  source?: string;
  timestamp?: string;
  hash?: string;
}

export function generateOriginSignature(text: string, accountEmail?: string): string {
  const account = accountEmail || 'sentience-guest';
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  const cleanHash = Math.abs(hash).toString(16);
  return `SIG-${cleanHash}-${Date.now().toString(36)}`;
}

export async function copyTextWithOriginToken(
  text: string,
  options: { accountEmail?: string; source?: string } = {}
): Promise<boolean> {
  if (!text) return false;

  const email = options.accountEmail || 'user';
  const sig = generateOriginSignature(text, email);
  const now = new Date().toISOString();

  const escapedHtml = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');

  const richHtml = `
<div data-sentience-origin="${email}" data-sentience-sig="${sig}" data-sentience-timestamp="${now}" style="display:none;mso-hide:all;font-size:0pt;line-height:0pt;color:transparent;visibility:hidden;max-height:0;overflow:hidden;">
  <!-- [sentience-origin="${email}"] [sentience-token="${sig}"] -->
</div>
<span style="display:none;mso-hide:all;font-size:0pt;visibility:hidden;">sentience-origin="${email}"</span>
<div style="font-family: inherit; font-size: inherit;">${escapedHtml}</div>
`.trim();

  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
      const textBlob = new Blob([text], { type: 'text/plain' });
      const htmlBlob = new Blob([richHtml], { type: 'text/html' });

      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': textBlob,
          'text/html': htmlBlob
        })
      ]);
      return true;
    }
  } catch {
    // ClipboardItem güvenlik veya izin engeli durumunda düz metin fallback
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
