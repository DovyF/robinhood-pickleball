import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AnalyticsEventType } from "@/lib/enums";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ results: [] });

  const products = await prisma.product.findMany({
    where: {
      status: "active",
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
        { tags: { contains: q } },
        { productType: { contains: q } },
      ],
    },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
    take: 8,
    orderBy: { salesCount: "desc" },
  });

  prisma.analyticsEvent.create({ data: { type: AnalyticsEventType.SEARCH, metaJson: JSON.stringify({ q }) } }).catch(() => {});

  return NextResponse.json({
    results: products.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      image: p.images[0]?.url ?? null,
    })),
  });
}
