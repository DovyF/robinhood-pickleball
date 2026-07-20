"use server";

import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertStaff, logAudit } from "@/lib/admin-auth";
import { saveImage } from "@/lib/upload";
import { recomputeProductRating } from "@/app/actions/reviews";

const variantSchema = z.object({
  id: z.string().optional(),
  title: z.string().default("Default"),
  sku: z.string().optional(),
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().nullable().optional(),
  option1: z.string().nullable().optional(),
  inventoryQty: z.number().int(),
  trackInventory: z.boolean().default(true),
  weightGrams: z.number().nonnegative().default(0),
});

const productSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().default(""),
  productType: z.string().optional(),
  vendor: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  featured: z.boolean().default(false),
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().nullable().optional(),
  costPerItem: z.number().nonnegative().nullable().optional(),
  weightGrams: z.number().nonnegative().default(0),
  tags: z.string().default(""),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  optionName: z.string().optional(),
  images: z.array(z.string()).default([]),
  variants: z.array(variantSchema).default([]),
});

function uniqueSlug(title: string, provided?: string) {
  return slugify(provided || title, { lower: true, strict: true });
}

export async function saveProductAction(raw: unknown) {
  await assertStaff();
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid product data" };
  const d = parsed.data;
  let slug = uniqueSlug(d.title, d.slug);

  // ensure slug uniqueness
  const clash = await prisma.product.findFirst({ where: { slug, id: d.id ? { not: d.id } : undefined } });
  if (clash) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const base = {
    title: d.title,
    slug,
    description: d.description,
    descriptionHtml: d.description.startsWith("<") ? d.description : `<p>${d.description.replace(/\n/g, "</p><p>")}</p>`,
    productType: d.productType,
    vendor: d.vendor,
    status: d.status,
    featured: d.featured,
    price: d.price,
    compareAtPrice: d.compareAtPrice ?? null,
    costPerItem: d.costPerItem ?? null,
    weightGrams: d.weightGrams,
    tags: d.tags,
    seoTitle: d.seoTitle,
    seoDescription: d.seoDescription,
    publishedAt: d.status === "active" ? new Date() : null,
  };

  let productId = d.id;
  if (d.id) {
    await prisma.product.update({ where: { id: d.id }, data: base });
    // Reset images + options + variants (simple full-replace strategy)
    await prisma.productImage.deleteMany({ where: { productId: d.id } });
    await prisma.productOption.deleteMany({ where: { productId: d.id } });
    await logAudit("product.update", "product", d.id, d.title);
  } else {
    const created = await prisma.product.create({ data: base });
    productId = created.id;
    await logAudit("product.create", "product", productId, d.title);
  }

  // Images
  for (let i = 0; i < d.images.length; i++) {
    await prisma.productImage.create({ data: { productId: productId!, url: d.images[i], position: i } });
  }

  // Option
  if (d.optionName && d.variants.length > 1) {
    await prisma.productOption.create({
      data: { productId: productId!, name: d.optionName, values: d.variants.map((v) => v.option1 || v.title).join(","), position: 0 },
    });
  }

  // Variants — upsert by id, delete removed
  const keepIds: string[] = [];
  for (let i = 0; i < d.variants.length; i++) {
    const v = d.variants[i];
    const data = {
      productId: productId!,
      title: v.title || v.option1 || "Default",
      sku: v.sku,
      price: v.price,
      compareAtPrice: v.compareAtPrice ?? null,
      option1: v.option1 ?? null,
      inventoryQty: v.inventoryQty,
      trackInventory: v.trackInventory,
      weightGrams: v.weightGrams,
      position: i,
    };
    if (v.id) {
      await prisma.productVariant.update({ where: { id: v.id }, data });
      keepIds.push(v.id);
    } else {
      const nv = await prisma.productVariant.create({ data });
      keepIds.push(nv.id);
    }
  }
  // No variants provided → ensure a default one exists
  if (d.variants.length === 0) {
    const existing = await prisma.productVariant.findFirst({ where: { productId: productId! } });
    if (existing) {
      await prisma.productVariant.update({ where: { id: existing.id }, data: { price: d.price, compareAtPrice: d.compareAtPrice ?? null } });
      keepIds.push(existing.id);
    } else {
      const nv = await prisma.productVariant.create({ data: { productId: productId!, title: "Default", price: d.price, inventoryQty: 0 } });
      keepIds.push(nv.id);
    }
  }
  await prisma.productVariant.deleteMany({ where: { productId: productId!, id: { notIn: keepIds } } });

  revalidatePath("/admin/products");
  revalidatePath(`/products/${slug}`);
  return { ok: true as const, id: productId, slug };
}

export async function deleteProductAction(id: string) {
  await assertStaff();
  await prisma.product.delete({ where: { id } }).catch(() => {});
  await logAudit("product.delete", "product", id);
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function bulkUpdateStatusAction(ids: string[], status: string) {
  await assertStaff();
  await prisma.product.updateMany({ where: { id: { in: ids } }, data: { status } });
  await logAudit("product.bulk_status", "product", ids.join(","), status);
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function uploadImageAction(formData: FormData) {
  await assertStaff();
  const file = formData.get("file") as File | null;
  if (!file) return { ok: false as const, error: "No file" };
  try {
    const { url } = await saveImage(file);
    return { ok: true as const, url };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function setInventoryAction(variantId: string, qty: number) {
  await assertStaff();
  await prisma.productVariant.update({ where: { id: variantId }, data: { inventoryQty: qty } });
  await logAudit("inventory.set", "variant", variantId, String(qty));
  revalidatePath("/admin/products");
  return { ok: true };
}

export { recomputeProductRating };
