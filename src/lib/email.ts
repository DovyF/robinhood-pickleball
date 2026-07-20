import { Resend } from "resend";
import { formatMoney } from "@/lib/utils";

// Transactional email via Resend. No-ops with a console log when RESEND_API_KEY
// is absent, so local dev and preview deploys never crash on email sends.

const FROM = process.env.EMAIL_FROM || "Robinhood Pickleball <orders@robinhoodpickleball.com>";
const STORE = process.env.NEXT_PUBLIC_STORE_NAME || "Robinhood Pickleball";

let _resend: Resend | null = null;
function client(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

async function send(to: string, subject: string, html: string) {
  const c = client();
  if (!c) {
    console.info(`[email:noop] To:${to} Subject:${subject}`);
    return { ok: false, skipped: true };
  }
  try {
    await c.emails.send({ from: FROM, to, subject, html });
    return { ok: true };
  } catch (e) {
    console.error("[email:error]", (e as Error).message);
    return { ok: false, error: (e as Error).message };
  }
}

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    <div style="text-align:center;padding:8px 0 24px">
      <span style="font-size:22px;font-weight:800;letter-spacing:-.02em;color:#14532d">🎾 ${STORE}</span>
    </div>
    <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
      <h1 style="font-size:20px;margin:0 0 16px">${title}</h1>
      ${body}
    </div>
    <p style="text-align:center;color:#888;font-size:12px;margin-top:24px">
      ${STORE} · robinhoodpickleball.com
    </p>
  </div></body></html>`;
}

interface OrderEmailItem { title: string; variantTitle?: string | null; quantity: number; total: number; }
interface OrderEmailData {
  orderNumber: number; email: string; items: OrderEmailItem[];
  subtotal: number; shippingTotal: number; taxTotal: number; discountTotal: number; total: number;
  shippingAddress?: { line1: string; city: string; state: string; postalCode: string } | null;
}

export async function sendOrderConfirmation(data: OrderEmailData) {
  const rows = data.items
    .map(
      (i) => `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee">${i.title}${i.variantTitle ? ` <span style="color:#888">(${i.variantTitle})</span>` : ""} × ${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatMoney(i.total)}</td></tr>`
    )
    .join("");
  const body = `
    <p>Thanks for your order! We're getting it ready to ship.</p>
    <p style="color:#888;margin:0 0 16px">Order <strong>#${data.orderNumber}</strong></p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
    <table style="width:100%;margin-top:16px;font-size:14px">
      <tr><td>Subtotal</td><td style="text-align:right">${formatMoney(data.subtotal)}</td></tr>
      ${data.discountTotal ? `<tr><td>Discount</td><td style="text-align:right;color:#16a34a">−${formatMoney(data.discountTotal)}</td></tr>` : ""}
      <tr><td>Shipping</td><td style="text-align:right">${data.shippingTotal ? formatMoney(data.shippingTotal) : "Free"}</td></tr>
      <tr><td>Tax</td><td style="text-align:right">${formatMoney(data.taxTotal)}</td></tr>
      <tr><td style="padding-top:8px;font-weight:700">Total</td><td style="padding-top:8px;text-align:right;font-weight:700">${formatMoney(data.total)}</td></tr>
    </table>`;
  return send(data.email, `Order #${data.orderNumber} confirmed`, shell("Order confirmed 🎉", body));
}

export async function sendShippingNotification(to: string, orderNumber: number, carrier: string, trackingNumber: string, trackingUrl?: string) {
  const body = `<p>Good news — your order <strong>#${orderNumber}</strong> is on its way!</p>
    <p>Carrier: <strong>${carrier}</strong><br>Tracking: <strong>${trackingNumber}</strong></p>
    ${trackingUrl ? `<p><a href="${trackingUrl}" style="display:inline-block;background:#14532d;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none">Track your package</a></p>` : ""}`;
  return send(to, `Your order #${orderNumber} has shipped`, shell("It's on the way 📦", body));
}

export async function sendPasswordReset(to: string, resetUrl: string) {
  const body = `<p>We received a request to reset your password.</p>
    <p><a href="${resetUrl}" style="display:inline-block;background:#14532d;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none">Reset password</a></p>
    <p style="color:#888;font-size:13px">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`;
  return send(to, "Reset your password", shell("Password reset", body));
}

export async function sendEmailVerification(to: string, verifyUrl: string) {
  const body = `<p>Welcome to ${STORE}! Please confirm your email address.</p>
    <p><a href="${verifyUrl}" style="display:inline-block;background:#14532d;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none">Verify email</a></p>`;
  return send(to, "Verify your email", shell("Confirm your email", body));
}

export async function sendAbandonedCart(to: string, recoverUrl: string, discountCode?: string) {
  const body = `<p>You left some gear in your cart! Complete your order before it's gone.</p>
    ${discountCode ? `<p>Use code <strong>${discountCode}</strong> at checkout.</p>` : ""}
    <p><a href="${recoverUrl}" style="display:inline-block;background:#14532d;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none">Return to cart</a></p>`;
  return send(to, "You left something behind 🎾", shell("Still thinking it over?", body));
}

export async function sendContactMessage(fromEmail: string, name: string, message: string) {
  const to = process.env.ADMIN_EMAIL || "admin@robinhoodpickleball.com";
  const body = `<p><strong>${name}</strong> (${fromEmail}) wrote:</p><p>${message.replace(/\n/g, "<br>")}</p>`;
  return send(to, `New contact message from ${name}`, shell("Contact form", body));
}
