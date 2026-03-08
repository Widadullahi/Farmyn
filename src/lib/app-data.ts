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
    image: "data:image/jpeg;base64,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",
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
