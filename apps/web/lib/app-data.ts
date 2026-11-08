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
  referralCode?: string;
  referralCount?: number;
  referredBy?: string;
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
  inStock: boolean;
  stockCount: number;
  unit: string;
  minimumOrder: string;
  description: string;
  featured: boolean;
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

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaLabel: string;
  ctaHref: string;
  placement: "homepage" | "category";
  startsAt: string;
  endsAt: string;
  price: number;
  sponsorName: string;
  status: "active";
  createdAt: string;
}

export interface AppState {
  users: User[];
  currentUserId: string | null;
  products: Product[];
  banners: Banner[];
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

export const initialAppState: AppState = { users: [], currentUserId: null, products: [], banners: [], chatMessages: [] };

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
