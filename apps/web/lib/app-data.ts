export type UserRole = "buyer" | "seller";

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  location: string;
  storeName?: string;
  bio?: string;
  verified: boolean;
  emailVerified: boolean;
  joinedAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number | null;
  image: string;
  sellerId: string;
  sellerName: string;
  sellerVerified: boolean;
  location: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount: number;
  unit: string;
  minimumOrder: string;
  description: string;
  featured: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  sellerId: string;
  sellerName: string;
}

export interface OrderEvent {
  label: string;
  date: string;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  items: OrderItem[];
  subtotal: number;
  commission: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: string;
  note?: string;
  status:
    | "Pending Seller Confirmation"
    | "Preparing Order"
    | "In Transit"
    | "Delivered"
    | "Completed";
  paymentStatus: "Awaiting Payment" | "Paid" | "Unverified";
  paymentReference?: string;
  createdAt: string;
  timeline: OrderEvent[];
}

export interface Review {
  id: string;
  productId: string;
  buyerId: string;
  buyerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface BulkRequest {
  id: string;
  buyerId: string;
  buyerName: string;
  title: string;
  category: string;
  quantity: string;
  budget: number;
  location: string;
  notes: string;
  status: "Open" | "Reviewing Offers" | "Closed";
  createdAt: string;
}

export interface AdRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  type: "Homepage Banner" | "Sidebar Ad" | "Featured Listing";
  title: string;
  budget: number;
  status: "Pending Approval" | "Approved" | "Rejected";
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  message: string;
  productId?: string;
  productName?: string;
  createdAt: string;
}

export interface AppState {
  users: User[];
  currentUserId: string | null;
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  reviews: Review[];
  bulkRequests: BulkRequest[];
  adRequests: AdRequest[];
  chatMessages: ChatMessage[];
}

export const allCategories = [
  "All",
  "Vegetables",
  "Fruits",
  "Grains & Cereals",
  "Spices & Seasonings",
  "Poultry & Eggs",
  "Livestock & Meat",
  "Pantry Ingredients",
] as const;

export const marketplaceCategories = allCategories.filter((category) => category !== "All");

export const initialAppState: AppState = { users: [], currentUserId: null, products: [], cart: [], orders: [], reviews: [], bulkRequests: [], adRequests: [], chatMessages: [] };

export const orderStatusFlow: Order["status"][] = [
  "Pending Seller Confirmation",
  "Preparing Order",
  "In Transit",
  "Delivered",
  "Completed",
];

export const formatNaira = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export const createId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
