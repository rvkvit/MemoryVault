const key = (recipientId: string) => `mv_inv_${recipientId}`

export function storeInviteUrl(recipientId: string, url: string): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key(recipientId), url) } catch { /* storage full */ }
}

export function getStoredInviteUrl(recipientId: string): string | null {
  if (typeof window === 'undefined') return null
  try { return localStorage.getItem(key(recipientId)) } catch { return null }
}
