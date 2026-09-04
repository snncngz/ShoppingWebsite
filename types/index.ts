export type PerfumeDetails = {
  volume: string[];
  fragranceFamily: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug?: string;
  categoryLeafSlug?: string;
  subcategory: string;
  price: number;
  oldPrice?: number;
  description: string;
  images: string[];
  colors: string[];
  sizes: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  isPopular: boolean;
  isNew: boolean;
  discount?: number;
  badge?: string;
  perfumeDetails?: PerfumeDetails;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
};

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  color: string;
  size: string;
};

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type Order = {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
};

export type {
  ApiErrorBody,
  ApiErrorCode,
  ApiErrorResponse,
  ApiResponse,
  ApiSuccessResponse,
  CategoryDetailDto,
  CategoryDto,
  CategorySummaryDto,
  HealthData,
  PaginatedDto,
  PaginationDto,
  ProductDto,
  ProductSummaryDto,
  CartDto,
  CartItemDto,
  WishlistDto,
  WishlistItemDto,
  OrderDto,
  OrderItemDto,
  OrderStatusDto,
  OrderCustomerDto,
  AdminOrderListItemDto,
  AdminOrderDetailDto,
  StockStatusDto,
  InventoryMovementTypeDto,
  AdminInventoryItemDto,
  InventoryMovementDto,
  PaymentStatusDto,
  PaymentDto,
  PaymentCreateDto,
} from "@/types/api";
export { API_ERROR_CODES } from "@/types/api";
export type { AuthUser, RegisterPendingDto, SafeUser, SessionUser, UserRole } from "@/types/auth";
