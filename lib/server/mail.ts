/** Sign-in e-mails, sent through Resend's REST API (no package). Server only. */
export const mailReady = () => !!process.env.RESEND_API_KEY;

export async function sendLoginLink(to: string, link: string, fr: boolean) {
  const from = process.env.EMAIL_FROM || "Royal Ace <login@royal-ace.club>";
  const subject = fr ? "Ton lien de connexion Royal Ace" : "Your Royal Ace sign-in link";
  const lead = fr ? "Appuie sur le bouton pour te connecter à Royal Ace. Le lien marche une seule fois, pendant 15 minutes." : "Tap the button to sign in to Royal Ace. The link works once, for 15 minutes.";
  const btn = fr ? "Me connecter" : "Sign me in";
  const foot = fr ? "Tu n'as rien demandé ? Ignore cet e-mail, rien ne se passera." : "Didn't ask for this? Just ignore this e-mail, nothing will happen.";
  const html = `<!doctype html><html><body style="margin:0;background:#0b0b0b;font-family:Arial,Helvetica,sans-serif;color:#eee">
<div style="max-width:480px;margin:0 auto;padding:36px 24px;text-align:center">
<p style="margin:0;font-family:Georgia,serif;font-size:28px;letter-spacing:6px;color:#e5c779;font-weight:bold">ROYAL ACE</p>
<p style="margin:24px 0 0;font-size:15px;line-height:22px;color:#ddd">${lead}</p>
<p style="margin:28px 0"><a href="${link}" style="display:inline-block;background:#e5c779;color:#1a1206;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:999px">${btn}</a></p>
<p style="margin:0;font-size:12px;line-height:18px;color:#888">${foot}</p>
<p style="margin:24px 0 0;font-size:11px;color:#666">royal-ace.club · free casino, virtual chips only · 18+</p>
</div></body></html>`;
  const text = `${lead}\n\n${link}\n\n${foot}`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("mail-failed");
}
