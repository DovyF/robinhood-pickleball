// App-level enum definitions (since SQLite dev DB stores these as strings).
// Use these constants everywhere instead of raw string literals.

export const UserRole = {
  CUSTOMER: "customer",
  STAFF: "staff",
  ADMIN: "admin",
  OWNER: "owner",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const STAFF_ROLES: string[] = [UserRole.STAFF, UserRole.ADMIN, UserRole.OWNER];
export const ADMIN_ROLES: string[] = [UserRole.ADMIN, UserRole.OWNER];

export const ProductStatus = {
  DRAFT: "draft",
  ACTIVE: "active",
  ARCHIVED: "archived",
} as const;

export const OrderStatus = {
  PENDING: "pending",
  PAID: "paid",
  FULFILLED: "fulfilled",
  PARTIALLY_FULFILLED: "partially_fulfilled",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export const PaymentStatus = {
  PENDING: "pending",
  PAID: "paid",
  PARTIALLY_REFUNDED: "partially_refunded",
  REFUNDED: "refunded",
  FAILED: "failed",
} as const;

export const FulfillmentStatus = {
  UNFULFILLED: "unfulfilled",
  PARTIALLY_FULFILLED: "partially_fulfilled",
  FULFILLED: "fulfilled",
} as const;

export const DiscountType = {
  PERCENTAGE: "percentage",
  FIXED_AMOUNT: "fixed_amount",
  FREE_SHIPPING: "free_shipping",
} as const;

export const HomepageSectionType = {
  HERO: "hero",
  FEATURED_COLLECTION: "featured_collection",
  RICH_TEXT: "rich_text",
  IMAGE_BANNER: "image_banner",
  PRODUCT_GRID: "product_grid",
  TESTIMONIALS: "testimonials",
  LOGO_LIST: "logo_list",
  NEWSLETTER: "newsletter",
} as const;

export const AnalyticsEventType = {
  PAGE_VIEW: "page_view",
  PRODUCT_VIEW: "product_view",
  ADD_TO_CART: "add_to_cart",
  BEGIN_CHECKOUT: "begin_checkout",
  PURCHASE: "purchase",
  SEARCH: "search",
} as const;
