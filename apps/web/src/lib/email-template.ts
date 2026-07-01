/** Convert the backend /api/v1/invite/TOKEN URL to the clean frontend /t/TOKEN URL. */
export function buildFrontendUrl(backendInviteUrl: string): string {
  const token = backendInviteUrl.split('/').pop() ?? ''
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/t/${token}`
}

/** HTML email — renders with bold, links, and proper spacing when pasted into Outlook. */
export function buildOutlookHtml(firstName: string, inviteUrl: string): string {
  return `
<div style="font-family:Calibri,'Segoe UI',Arial,sans-serif;font-size:14px;line-height:1.75;color:#1f1f1f;max-width:580px">

<p>Hi <strong>${firstName}</strong>,</p>

<p>As my journey at LähiTapiola comes to an end, I wanted to say goodbye in a way that felt a little more personal than a traditional farewell email.</p>

<p>Over the years, I've had the privilege of working with many wonderful people, and you are someone who made this journey genuinely memorable.</p>

<p>Instead of writing the same farewell message to everyone, I decided to build something different.</p>

<p>I've created a private Memory Vault exclusively for you. Inside, you'll find a personal message that I wanted to leave with you before moving on to my next chapter.</p>

<p><em>Your invitation is private and intended only for you.</em></p>

<p style="margin:16px 0">
  <a href="${inviteUrl}" style="color:#0078D4;font-weight:700;font-size:15px;text-decoration:none">🔗 Your Personal Memory Vault</a>
</p>

<p>Thank you for being part of my journey. It has been a pleasure working with you, and I sincerely hope our paths cross again someday.</p>

<p>With gratitude,</p>

<p>
  <strong>Rovin Krishnia</strong><br>
  Personal Email:&nbsp;<a href="mailto:rvk.vit@gmail.com" style="color:#0078D4">rvk.vit@gmail.com</a><br>
  LinkedIn:&nbsp;<a href="https://www.linkedin.com/in/rovin-krishnia-a88a2b1a/" style="color:#0078D4">linkedin.com/in/rovin-krishnia-a88a2b1a</a><br>
  Contact:&nbsp;+91 7387660007 (Available on WhatsApp)
</p>

</div>`.trim()
}

/** Plain-text fallback — used for mailto: links and non-HTML clipboard clients. */
export function buildOutlookPlain(firstName: string, inviteUrl: string): string {
  return [
    `Hi ${firstName},`,
    '',
    'As my journey at LähiTapiola comes to an end, I wanted to say goodbye in a way that felt a little more personal than a traditional farewell email.',
    '',
    "Over the years, I've had the privilege of working with many wonderful people, and you are someone who made this journey genuinely memorable.",
    '',
    'Instead of writing the same farewell message to everyone, I decided to build something different.',
    '',
    "I've created a private Memory Vault exclusively for you. Inside, you'll find a personal message that I wanted to leave with you before moving on to my next chapter.",
    '',
    'Your invitation is private and intended only for you.',
    '',
    `🔗 Your Personal Memory Vault: ${inviteUrl}`,
    '',
    'Thank you for being part of my journey. It has been a pleasure working with you, and I sincerely hope our paths cross again someday.',
    '',
    'With gratitude,',
    '',
    'Rovin Krishnia',
    'Personal Email: rvk.vit@gmail.com',
    'LinkedIn: https://www.linkedin.com/in/rovin-krishnia-a88a2b1a/',
    'Contact: +91 7387660007 (Available on WhatsApp)',
  ].join('\n')
}

/**
 * Build a mailto: URL that opens a pre-filled Outlook compose window.
 * The OS hands the mailto: protocol to whatever email client is set as default.
 */
export function buildMailtoUrl(
  recipientEmail: string,
  firstName: string,
  frontendInviteUrl: string,
): string {
  const subject = 'Before I say goodbye...'
  const body = buildOutlookPlain(firstName, frontendInviteUrl)
  return `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
