import type { Order as PrismaOrder, OrderItem as PrismaOrderItem } from "@prisma/client";

export type OrderWithItems = PrismaOrder & {
  items: PrismaOrderItem[];
};
