export const API_ERROR_CODES = [
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "METHOD_NOT_ALLOWED",
  "TOO_MANY_REQUESTS",
  "INTERNAL_ERROR",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorBody = {
  code: ApiErrorCode;
  message: string;
};

export type ApiErrorResponse = {
  success: false;
  error: ApiErrorBody;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type HealthData = {
  status: "ok" | "degraded";
  database: "ok" | "unavailable";
  environment: "development" | "production" | "test";
};

export type CategorySummaryDto = {
  id: string;
  name: string;
  slug: string;
  parent: CategorySummaryDto | null;
};

export type CategoryChildDto = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  children: CategoryChildDto[];
};

export type ProductSummaryDto = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export type ProductDto = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  oldPrice: number | null;
  discount: number | null;
  stock: number;
  subcategory: string;
  images: string[];
  colors: string[];
  sizes: string[];
  rating: number;
  reviewCount: number;
  isPopular: boolean;
  isNew: boolean;
  isActive: boolean;
  badge: string | null;
  campaignPercent: number | null;
  perfumeDetails: unknown;
  categoryId: string;
  category: CategorySummaryDto;
  createdAt: string;
  updatedAt: string;
};

export type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  parentId: string | null;
  parentSlug: string | null;
  children: CategoryChildDto[];
  createdAt: string;
  updatedAt: string;
};

export type CategoryDetailDto = CategoryDto & {
  products: ProductSummaryDto[];
};

export type PaginationDto = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedDto<T> = {
  items: T[];
  pagination: PaginationDto;
};

export type CartItemDto = {
  id: string;
  productId: string;
  quantity: number;
  variant: string;
  product: ProductDto;
  createdAt: string;
  updatedAt: string;
};

export type CartDto = {
  id: string;
  items: CartItemDto[];
};

export type WishlistItemDto = {
  id: string;
  productId: string;
  product: ProductDto;
  createdAt: string;
};

export type WishlistDto = {
  id: string;
  items: WishlistItemDto[];
};

export type OrderStatusDto =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type OrderItemDto = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  variant: string;
  product: ProductSummaryDto;
  createdAt: string;
};

export type OrderDto = {
  id: string;
  status: OrderStatusDto;
  total: number;
  giftWrap: boolean;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
};

export type OrderCustomerDto = {
  id: string;
  name: string;
  email: string;
};

export type AdminOrderListItemDto = {
  id: string;
  status: OrderStatusDto;
  total: number;
  createdAt: string;
  itemCount: number;
  user: OrderCustomerDto;
};

export type AdminOrderDetailDto = OrderDto & {
  user: OrderCustomerDto;
  payments: PaymentDto[];
};

export type PaymentStatusDto =
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentDto = {
  id: string;
  orderId: string;
  provider: string;
  status: PaymentStatusDto;
  amount: number;
  currency: string;
  checkoutUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentCreateDto = PaymentDto & {
  orderStatus: OrderStatusDto;
};

export type AdminUserListItemDto = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  emailVerified: boolean;
  orderCount: number;
  createdAt: string;
  canDelete: boolean;
};

export type AdminUserDetailDto = AdminUserListItemDto & {
  phone: string;
  addressTitle: string;
  addressLine: string;
  addressCity: string;
  updatedAt: string;
};

export type NewsletterSubscriberDto = {
  id: string;
  email: string;
  createdAt: string;
};

export type WelcomeSettingsDto = {
  welcomeSubject: string;
  welcomeBody: string;
  updatedAt: string;
};

export type AdminMailSendResultDto = {
  sent: number;
  failed: number;
  skipped: number;
};

export type StockStatusDto = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type InventoryMovementTypeDto =
  | "SALE"
  | "RESTOCK"
  | "RETURN"
  | "CANCELLATION"
  | "ADJUSTMENT";

export type AdminInventoryItemDto = {
  id: string;
  name: string;
  slug: string;
  stock: number;
  lowStockThreshold: number;
  stockStatus: StockStatusDto;
  updatedAt: string;
};

export type InventoryMovementDto = {
  id: string;
  productId: string;
  quantity: number;
  type: InventoryMovementTypeDto;
  reason: string;
  referenceId: string | null;
  createdAt: string;
};

