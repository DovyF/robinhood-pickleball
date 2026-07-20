import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { computeTotals, type DiscountLike } from "@/lib/pricing";
import { auth } from "@/lib/auth";

const CART_COOKIE = "rh_cart";

export interface CartLineView {
  id: string;
  productId: string;
  variantId: string | null;
  title: string;
  variantTitle: string | null;
  slug: string;
  imageUrl: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  lineTotal: number;
  weightGrams: number;
  available: number;
  maxQty: number;
}

export interface CartView {
  id: string;
  token: string;
  lines: CartLineView[];
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  discountCode: string | null;
  totalWeightGrams: number;
}

const cartInclude = {
  items: {
    include: {
      product: { include: { images: { orderBy: { position: "asc" as const }, take: 1 } } },
      variant: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
};

/** Read cart token cookie (does not create). */
async function readToken(): Promise<string | undefined> {
  const c = await cookies();
  return c.get(CART_COOKIE)?.value;
}

/** Get or create the active cart for the current visitor and set the cookie. */
export async function getOrCreateCart() {
  const token = await readToken();
  const session = await auth();
  const userId = session?.user?.id;

  let cart = token
    ? await prisma.cart.findFirst({ where: { token, status: "active" }, include: cartInclude })
    : null;

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: userId ?? undefined, email: session?.user?.email ?? undefined },
      include: cartInclude,
    });
    const c = await cookies();
    c.set(CART_COOKIE, cart.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  } else if (userId && !cart.userId) {
    cart = await prisma.cart.update({ where: { id: cart.id }, data: { userId }, include: cartInclude });
  }
  return cart;
}

/** Read-only cart view for rendering (no cookie writes). Safe in server components. */
export async function getCartView(): Promise<CartView | null> {
  const token = await readToken();
  if (!token) return null;
  const cart = await prisma.cart.findFirst({ where: { token, status: "active" }, include: cartInclude });
  if (!cart) return null;
  return toView(cart);
}

type CartWithItems = NonNullable<Awaited<ReturnType<typeof getOrCreateCart>>>;

export function toView(cart: CartWithItems): CartView {
  const lines: CartLineView[] = cart.items.map((it) => {
    const unitPrice = it.variant?.price ?? it.product.price;
    const compareAtPrice = it.variant?.compareAtPrice ?? it.product.compareAtPrice ?? null;
    const available = it.variant
      ? it.variant.trackInventory
        ? it.variant.inventoryQty
        : 9999
      : 9999;
    const qty = Math.min(it.quantity, Math.max(available, 1));
    return {
      id: it.id,
      productId: it.productId,
      variantId: it.variantId,
      title: it.product.title,
      variantTitle: it.variant && it.variant.title !== "Default" ? it.variant.title : null,
      slug: it.product.slug,
      imageUrl: it.product.images[0]?.url ?? null,
      unitPrice,
      compareAtPrice,
      quantity: qty,
      lineTotal: Math.round(unitPrice * qty * 100) / 100,
      weightGrams: it.variant?.weightGrams ?? it.product.weightGrams,
      available,
      maxQty: Math.min(available, 99),
    };
  });

  const discount = cart.discountCode ? undefined : undefined; // discount resolved at checkout
  const totals = computeTotals({
    lines: lines.map((l) => ({ price: l.unitPrice, quantity: l.quantity, weightGrams: l.weightGrams, productId: l.productId })),
    discount: discount as DiscountLike | undefined,
  });

  return {
    id: cart.id,
    token: cart.token,
    lines,
    itemCount: totals.itemCount,
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    discountCode: cart.discountCode ?? null,
    totalWeightGrams: totals.totalWeightGrams,
  };
}

export async function addToCart(productId: string, variantId: string | null, quantity = 1) {
  const cart = await getOrCreateCart();
  const existing = cart.items.find((i) => i.productId === productId && i.variantId === (variantId ?? null));
  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + quantity } });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId, variantId: variantId ?? undefined, quantity } });
  }
  await prisma.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
  return getCartViewByToken(cart.token);
}

export async function updateLine(lineId: string, quantity: number) {
  const cart = await getOrCreateCart();
  const line = cart.items.find((i) => i.id === lineId);
  if (!line) return toView(cart);
  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: lineId } });
  } else {
    await prisma.cartItem.update({ where: { id: lineId }, data: { quantity } });
  }
  return getCartViewByToken(cart.token);
}

export async function removeLine(lineId: string) {
  const cart = await getOrCreateCart();
  await prisma.cartItem.deleteMany({ where: { id: lineId, cartId: cart.id } });
  return getCartViewByToken(cart.token);
}

export async function setDiscountCode(code: string | null) {
  const cart = await getOrCreateCart();
  await prisma.cart.update({ where: { id: cart.id }, data: { discountCode: code } });
  return getCartViewByToken(cart.token);
}

async function getCartViewByToken(token: string): Promise<CartView> {
  const cart = await prisma.cart.findFirst({ where: { token }, include: cartInclude });
  return toView(cart!);
}
