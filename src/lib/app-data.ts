export type UserRole = "buyer" | "seller";

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  password: string;
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
  paymentStatus: "Held in Escrow" | "Released to Seller";
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

export interface AppState {
  users: User[];
  currentUserId: string | null;
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  reviews: Review[];
  bulkRequests: BulkRequest[];
  adRequests: AdRequest[];
}

const sellerNgoziId = "seller-ngozi";
const sellerAgroId = "seller-agropoultry";
const buyerAdaId = "buyer-ada";

const today = new Date().toISOString();

export const seedUsers: User[] = [
  {
    id: sellerNgoziId,
    role: "seller",
    name: "Ngozi Okafor",
    email: "ngozi@farmlink.ng",
    phone: "+2348030001111",
    password: "demo1234",
    location: "Jos, Plateau",
    storeName: "Mama Ngozi Farm",
    bio: "Fresh vegetables and peppers from Plateau State with same-day harvest updates.",
    verified: true,
    emailVerified: true,
    joinedAt: "2025-11-02T08:00:00.000Z",
  },
  {
    id: sellerAgroId,
    role: "seller",
    name: "Tunde Adebayo",
    email: "sales@agropoultry.ng",
    phone: "+2348054442222",
    password: "demo1234",
    location: "Ibadan, Oyo",
    storeName: "AgroPoultry Ltd",
    bio: "Reliable poultry supplier serving households, restaurants, and bulk buyers.",
    verified: true,
    emailVerified: true,
    joinedAt: "2025-10-11T08:00:00.000Z",
  },
  {
    id: buyerAdaId,
    role: "buyer",
    name: "Ada Nwosu",
    email: "ada@buyer.ng",
    phone: "+2348098884444",
    password: "demo1234",
    location: "Lekki, Lagos",
    verified: true,
    emailVerified: true,
    joinedAt: "2026-01-04T08:00:00.000Z",
  },
];

export const seedProducts: Product[] = [
  {
    id: "prod-tomatoes",
    name: "Fresh Tomatoes Basket",
    price: 8500,
    image: "https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=900&q=80",
    category: "Vegetables",
    sellerId: sellerNgoziId,
    sellerName: "Mama Ngozi Farm",
    sellerVerified: true,
    location: "Jos, Plateau",
    rating: 4.8,
    reviewCount: 24,
    inStock: true,
    stockCount: 32,
    unit: "basket",
    minimumOrder: "1 basket",
    description: "Freshly harvested tomatoes packed for household and restaurant buyers.",
    featured: true,
  },
  {
    id: "prod-broiler",
    name: "Live Broiler Chicken",
    price: 5500,
    image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=900&q=80",
    category: "Poultry",
    sellerId: sellerAgroId,
    sellerName: "AgroPoultry Ltd",
    sellerVerified: true,
    location: "Ibadan, Oyo",
    rating: 4.6,
    reviewCount: 17,
    inStock: true,
    stockCount: 80,
    unit: "bird",
    minimumOrder: "2 birds",
    description: "Healthy broilers raised for dependable supply and doorstep delivery.",
    featured: true,
  },
  {
    id: "prod-yam",
    name: "Yam Tubers Pack",
    price: 15000,
    image: "https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=900&q=80",
    category: "Vegetables",
    sellerId: sellerNgoziId,
    sellerName: "Mama Ngozi Farm",
    sellerVerified: true,
    location: "Makurdi, Benue",
    rating: 4.9,
    reviewCount: 31,
    inStock: true,
    stockCount: 18,
    unit: "10 tubers",
    minimumOrder: "1 pack",
    description: "Uniform yam tubers sourced from trusted growers for family and wholesale needs.",
    featured: true,
  },
  {
    id: "prod-catfish",
    name: "Smoked Catfish",
    price: 4200,
    image: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=900&q=80",
    category: "Processed Food",
    sellerId: sellerNgoziId,
    sellerName: "Mama Ngozi Farm",
    sellerVerified: true,
    location: "Warri, Delta",
    rating: 4.5,
    reviewCount: 12,
    inStock: true,
    stockCount: 40,
    unit: "1kg",
    minimumOrder: "2kg",
    description: "Well-smoked catfish sealed for transport and restaurant cooking.",
    featured: true,
  },
  {
    id: "prod-cow",
    name: "Healthy Medium Cow",
    price: 350000,
    image: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=900&q=80",
    category: "Livestock",
    sellerId: sellerAgroId,
    sellerName: "AgroPoultry Ltd",
    sellerVerified: true,
    location: "Kano, Kano",
    rating: 4.7,
    reviewCount: 8,
    inStock: true,
    stockCount: 5,
    unit: "cow",
    minimumOrder: "1 cow",
    description: "Healthy livestock option for butchers, restaurants, and bulk buyers.",
    featured: false,
  },
  {
    id: "prod-palm-oil",
    name: "Palm Oil Jerry Can",
    price: 22000,
    image: "https://images.unsplash.com/photo-1474979266404-7eaacdc948e4?w=900&q=80",
    category: "Processed Food",
    sellerId: sellerNgoziId,
    sellerName: "Mama Ngozi Farm",
    sellerVerified: true,
    location: "Aba, Abia",
    rating: 4.4,
    reviewCount: 10,
    inStock: false,
    stockCount: 0,
    unit: "25 litres",
    minimumOrder: "1 can",
    description: "Red palm oil packaged for secure transport with transparent quality sourcing.",
    featured: false,
  },
];

export const seedReviews: Review[] = [
  {
    id: "review-1",
    productId: "prod-tomatoes",
    buyerId: buyerAdaId,
    buyerName: "Ada Nwosu",
    rating: 5,
    comment: "Fresh and well packed. Delivery was smooth and the escrow flow gave me confidence.",
    createdAt: "2026-02-21T09:30:00.000Z",
  },
  {
    id: "review-2",
    productId: "prod-broiler",
    buyerId: buyerAdaId,
    buyerName: "Ada Nwosu",
    rating: 4,
    comment: "Good quality birds and accurate count. Seller responded quickly.",
    createdAt: "2026-02-12T09:30:00.000Z",
  },
];

export const seedOrders: Order[] = [
  {
    id: "ord-1001",
    buyerId: buyerAdaId,
    buyerName: "Ada Nwosu",
    sellerId: sellerNgoziId,
    sellerName: "Mama Ngozi Farm",
    items: [
      {
        productId: "prod-tomatoes",
        name: "Fresh Tomatoes Basket",
        quantity: 2,
        unitPrice: 8500,
        sellerId: sellerNgoziId,
        sellerName: "Mama Ngozi Farm",
      },
    ],
    subtotal: 17000,
    commission: 850,
    deliveryFee: 2500,
    total: 20350,
    deliveryAddress: "Admiralty Way, Lekki Phase 1, Lagos",
    status: "Delivered",
    paymentStatus: "Held in Escrow",
    createdAt: "2026-02-20T08:00:00.000Z",
    timeline: [
      { label: "Order placed and payment moved into escrow", date: "2026-02-20T08:00:00.000Z" },
      { label: "Seller confirmed stock and started packing", date: "2026-02-20T10:00:00.000Z" },
      { label: "Order moved in transit", date: "2026-02-21T08:00:00.000Z" },
      { label: "Buyer marked delivery successful", date: "2026-02-21T14:15:00.000Z" },
    ],
  },
];

export const seedBulkRequests: BulkRequest[] = [
  {
    id: "bulk-1",
    buyerId: buyerAdaId,
    buyerName: "Ada Nwosu",
    title: "Restaurant Tomato Supply for April",
    category: "Vegetables",
    quantity: "25 baskets weekly",
    budget: 180000,
    location: "Lekki, Lagos",
    notes: "Need reliable weekly restock with Friday delivery.",
    status: "Open",
    createdAt: today,
  },
];

export const seedAdRequests: AdRequest[] = [
  {
    id: "ad-1",
    sellerId: sellerNgoziId,
    sellerName: "Mama Ngozi Farm",
    type: "Featured Listing",
    title: "Tomatoes peak season push",
    budget: 15000,
    status: "Pending Approval",
    createdAt: "2026-03-01T10:00:00.000Z",
  },
];

export const initialAppState: AppState = {
  users: seedUsers,
  currentUserId: buyerAdaId,
  products: seedProducts,
  cart: [],
  orders: seedOrders,
  reviews: seedReviews,
  bulkRequests: seedBulkRequests,
  adRequests: seedAdRequests,
};

export const allCategories = [
  "All",
  "Vegetables",
  "Poultry",
  "Livestock",
  "Processed Food",
];

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
