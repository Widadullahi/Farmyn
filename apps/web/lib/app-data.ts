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

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  message: string;
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

const sellerNgoziId = "seller-ngozi";
const sellerAgroId = "seller-agropoultry";
const sellerTestId = "seller-test";
const buyerAdaId = "buyer-ada";
const today = new Date().toISOString();

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

export const seedUsers: User[] = [
  {
    id: sellerNgoziId,
    role: "seller",
    name: "Ngozi Okafor",
    email: "ngozi@farmyn.ng",
    phone: "+2348030001111",
    password: "demo1234",
    location: "Jos, Plateau",
    storeName: "Mama Ngozi Farm",
    bio: "Fresh vegetables, fruits, spices, and pantry staples sourced from trusted growers across the middle belt.",
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
    bio: "Reliable poultry, egg, grain, and livestock supply for households, restaurants, and bulk buyers.",
    verified: true,
    emailVerified: true,
    joinedAt: "2025-10-11T08:00:00.000Z",
  },
  {
    id: sellerTestId,
    role: "seller",
    name: "Test Seller",
    email: "seller@gmail.com",
    phone: "+2348012345678",
    password: "seller",
    location: "Lagos, Nigeria",
    storeName: "Test Seller Store",
    bio: "Independent seller store on Farmyn Nigeria.",
    verified: true,
    emailVerified: true,
    joinedAt: "2026-06-25T08:00:00.000Z",
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
    image: "https://images.pexels.com/photos/17674119/pexels-photo-17674119.jpeg?cs=srgb&dl=pexels-gulsahaydgn-17674119.jpg&fm=jpg",
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
    description: "Freshly harvested tomatoes packed for household kitchens, food vendors, and restaurant buyers.",
    featured: true,
  },
  {
    id: "prod-ugu",
    name: "Fresh Ugu Leaves Bundle",
    price: 2800,
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=900&q=80",
    category: "Vegetables",
    sellerId: sellerNgoziId,
    sellerName: "Mama Ngozi Farm",
    sellerVerified: true,
    location: "Jos, Plateau",
    rating: 4.6,
    reviewCount: 14,
    inStock: true,
    stockCount: 50,
    unit: "bundle",
    minimumOrder: "2 bundles",
    description: "Fresh ugu leaves for soups, stews, and healthy home cooking.",
    featured: false,
  },
  {
    id: "prod-oranges",
    name: "Sweet Orange Basket",
    price: 7200,
    image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=900&q=80",
    category: "Fruits",
    sellerId: sellerNgoziId,
    sellerName: "Mama Ngozi Farm",
    sellerVerified: true,
    location: "Benin, Edo",
    rating: 4.7,
    reviewCount: 19,
    inStock: true,
    stockCount: 26,
    unit: "basket",
    minimumOrder: "1 basket",
    description: "Juicy oranges suitable for juice businesses, homes, and market resellers.",
    featured: true,
  },
  {
    id: "prod-rice",
    name: "Local Rice Bag",
    price: 68000,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=900&q=80",
    category: "Grains & Cereals",
    sellerId: sellerAgroId,
    sellerName: "AgroPoultry Ltd",
    sellerVerified: true,
    location: "Kebbi, Kebbi",
    rating: 4.5,
    reviewCount: 11,
    inStock: true,
    stockCount: 15,
    unit: "50kg bag",
    minimumOrder: "1 bag",
    description: "Stone-sorted Nigerian local rice for homes, caterers, and food service buyers.",
    featured: false,
  },
  {
    id: "prod-maize",
    name: "Yellow Maize Grain Bag",
    price: 42000,
    image: "https://images.unsplash.com/photo-1603048719539-9ecb4b9d8f64?w=900&q=80",
    category: "Grains & Cereals",
    sellerId: sellerAgroId,
    sellerName: "AgroPoultry Ltd",
    sellerVerified: true,
    location: "Kaduna, Kaduna",
    rating: 4.4,
    reviewCount: 9,
    inStock: true,
    stockCount: 22,
    unit: "50kg bag",
    minimumOrder: "1 bag",
    description: "Clean yellow maize for feed production, processing, and wholesale buyers.",
    featured: false,
  },
  {
    id: "prod-ginger",
    name: "Dried Ginger Sack",
    price: 36000,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=900&q=80",
    category: "Spices & Seasonings",
    sellerId: sellerNgoziId,
    sellerName: "Mama Ngozi Farm",
    sellerVerified: true,
    location: "Kafanchan, Kaduna",
    rating: 4.8,
    reviewCount: 16,
    inStock: true,
    stockCount: 12,
    unit: "sack",
    minimumOrder: "1 sack",
    description: "Dried ginger for spice sellers, tea makers, processors, and export-focused buyers.",
    featured: false,
  },
  {
    id: "prod-pepper",
    name: "Pepper Mix Basket",
    price: 6400,
    image: "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=900&q=80",
    category: "Spices & Seasonings",
    sellerId: sellerNgoziId,
    sellerName: "Mama Ngozi Farm",
    sellerVerified: true,
    location: "Jos, Plateau",
    rating: 4.7,
    reviewCount: 22,
    inStock: true,
    stockCount: 30,
    unit: "basket",
    minimumOrder: "1 basket",
    description: "A mixed basket of peppers for stew bases, restaurants, and home kitchens.",
    featured: true,
  },
  {
    id: "prod-broiler",
    name: "Live Broiler Chicken",
    price: 5500,
    image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=900&q=80",
    category: "Poultry & Eggs",
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
    id: "prod-eggs",
    name: "Farm Fresh Eggs Tray",
    price: 5800,
    image: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=900&q=80",
    category: "Poultry & Eggs",
    sellerId: sellerAgroId,
    sellerName: "AgroPoultry Ltd",
    sellerVerified: true,
    location: "Ibadan, Oyo",
    rating: 4.8,
    reviewCount: 20,
    inStock: true,
    stockCount: 90,
    unit: "30-egg tray",
    minimumOrder: "2 trays",
    description: "Clean, fresh eggs for homes, bakeries, and food businesses.",
    featured: true,
  },
  {
    id: "prod-cow",
    name: "Healthy Medium Cow",
    price: 350000,
    image: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=900&q=80",
    category: "Livestock & Meat",
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
    description: "Healthy livestock option for butchers, restaurants, and bulk protein buyers.",
    featured: false,
  },
  {
    id: "prod-catfish",
    name: "Smoked Catfish Pack",
    price: 4200,
    image: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=900&q=80",
    category: "Livestock & Meat",
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
    description: "Well-smoked catfish sealed for transport and ready for retail or restaurant use.",
    featured: false,
  },
  {
    id: "prod-palm-oil",
    name: "Palm Oil Jerry Can",
    price: 22000,
    image: "https://images.unsplash.com/photo-1474979266404-7eaacdc948e4?w=900&q=80",
    category: "Pantry Ingredients",
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
  {
    id: "prod-garri",
    name: "Ijebu Garri Bag",
    price: 24500,
    image: "https://images.unsplash.com/photo-1600959907703-125ba1374a12?w=900&q=80",
    category: "Pantry Ingredients",
    sellerId: sellerNgoziId,
    sellerName: "Mama Ngozi Farm",
    sellerVerified: true,
    location: "Ijebu, Ogun",
    rating: 4.6,
    reviewCount: 13,
    inStock: true,
    stockCount: 18,
    unit: "25kg bag",
    minimumOrder: "1 bag",
    description: "Fine, dry garri suitable for homes, food vendors, and wholesale pantry buyers.",
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

export const seedChatMessages: ChatMessage[] = [
  {
    id: "chat-1",
    senderId: buyerAdaId,
    senderName: "Ada Nwosu",
    receiverId: sellerNgoziId,
    receiverName: "Mama Ngozi Farm",
    message: "Hello Mama Ngozi, do you have fresh basket of tomatoes in stock today?",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
  },
  {
    id: "chat-2",
    senderId: sellerNgoziId,
    senderName: "Mama Ngozi Farm",
    receiverId: buyerAdaId,
    receiverName: "Ada Nwosu",
    message: "Yes my daughter! Fresh from Jos. We just loaded 30 baskets this morning. You can place your order now, and we will package it immediately.",
    createdAt: new Date(Date.now() - 3600000 * 1.8).toISOString(),
  },
  {
    id: "chat-3",
    senderId: buyerAdaId,
    senderName: "Ada Nwosu",
    receiverId: sellerNgoziId,
    receiverName: "Mama Ngozi Farm",
    message: "Excellent! I will place an order for 2 baskets via escrow protection now.",
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
  },
  {
    id: "chat-4",
    senderId: buyerAdaId,
    senderName: "Ada Nwosu",
    receiverId: sellerAgroId,
    receiverName: "AgroPoultry Ltd",
    message: "Hello, I want to inquire about bulk ordering broilers for a restaurant delivery. Do you deliver to Lekki, Lagos?",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
  },
  {
    id: "chat-5",
    senderId: sellerAgroId,
    senderName: "AgroPoultry Ltd",
    receiverId: buyerAdaId,
    receiverName: "Ada Nwosu",
    message: "Yes we do, Ada. We supply live broilers weekly to Lagos. For orders over 20 birds, delivery is fully coordinated and covered by our logistics partner.",
    createdAt: new Date(Date.now() - 3600000 * 4.5).toISOString(),
  },
];

export const initialAppState: AppState = {
  users: seedUsers,
  currentUserId: null,
  products: seedProducts,
  cart: [],
  orders: seedOrders,
  reviews: seedReviews,
  bulkRequests: seedBulkRequests,
  adRequests: seedAdRequests,
  chatMessages: seedChatMessages,
};

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
