import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertStaff } from "@/lib/admin-auth";
import { formatMoney, formatDate, safeJson } from "@/lib/utils";
import type { CheckoutAddress } from "@/lib/orders";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await assertStaff();
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return new NextResponse("Not found", { status: 404 });

  const ship = safeJson<CheckoutAddress | null>(order.shippingAddressJson, null);
  const store = process.env.NEXT_PUBLIC_STORE_NAME || "Robinhood Pickleball";

  const rows = order.items
    .map((i) => `<tr><td>${i.title}${i.variantTitle ? ` — ${i.variantTitle}` : ""}</td><td>${i.sku ?? ""}</td><td style="text-align:center">${i.quantity}</td></tr>`)
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Packing Slip #${order.orderNumber}</title>
  <style>
    body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#16211a;max-width:760px;margin:32px auto;padding:0 24px}
    h1{font-size:22px;margin:0}
    .muted{color:#6b7a70;font-size:13px}
    .row{display:flex;justify-content:space-between;align-items:flex-start;margin:24px 0}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th,td{text-align:left;padding:10px 8px;border-bottom:1px solid #e6e2d6;font-size:14px}
    th{font-size:11px;text-transform:uppercase;color:#6b7a70}
    .box{border:1px solid #e6e2d6;border-radius:10px;padding:16px}
    @media print{ .noprint{display:none} body{margin:0} }
  </style></head><body onload="window.print()">
    <div class="row">
      <div><h1>🎾 ${store}</h1><p class="muted">Packing Slip</p></div>
      <div style="text-align:right"><strong>Order #${order.orderNumber}</strong><br><span class="muted">${formatDate(order.createdAt)}</span></div>
    </div>
    <div class="row">
      <div class="box" style="flex:1;margin-right:12px">
        <strong>Ship to</strong><br>
        ${ship ? `${ship.firstName} ${ship.lastName}<br>${ship.line1}${ship.line2 ? `, ${ship.line2}` : ""}<br>${ship.city}, ${ship.state} ${ship.postalCode}<br>${ship.country ?? "US"}` : order.email}
      </div>
      <div class="box" style="flex:1">
        <strong>Order details</strong><br>
        <span class="muted">Email:</span> ${order.email}<br>
        <span class="muted">Shipping:</span> ${order.shippingMethod ?? "—"}<br>
        <span class="muted">Items:</span> ${order.items.reduce((s, i) => s + i.quantity, 0)}
      </div>
    </div>
    <table>
      <thead><tr><th>Item</th><th>SKU</th><th style="text-align:center">Qty</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="muted" style="margin-top:32px">Thank you for playing with ${store}! Questions? hello@robinhoodpickleball.com</p>
    <button class="noprint" onclick="window.print()" style="margin-top:16px;padding:10px 18px;border-radius:8px;background:#14532d;color:#fff;border:none;cursor:pointer">Print</button>
  </body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
