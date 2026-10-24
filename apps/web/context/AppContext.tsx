"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { startCheckout, verifyCheckout } from "@/lib/paystack";
import {
  allCategories,
  AppState,
  BulkRequest,
  createId,
  initialAppState,
  Order,
  orderStatusFlow,
  Product,
  Review,
  User,
  UserRole,
  ChatMessage,
} from "@/lib/app-data";

const STORAGE_KEY = "farmyn-local-mvp-v1";

interface RegisterInput {
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  password: string;
  location: string;
  storeName?: string;
}

interface CheckoutInput {
  deliveryAddress: string;
  note?: string;
}

interface ProductInput {
  name: string;
  category: string;
  price: number;
  stockCount: number;
  unit: string;
  minimumOrder: string;
  image: string;
  location: string;
  description: string;
}

interface AppContextValue extends AppState {
  currentUser: User | null;
  isHydrated: boolean;
  categories: string[];
  cartCount: number;
  registerUser: (input: RegisterInput) => { ok: boolean; message: string; user?: User };
  login: (email: string, password: string) => { ok: boolean; message: string; user?: User };
  logout: () => void;
  addToCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  checkout: (input: CheckoutInput) => Promise<{ ok: boolean; message: string; authorizationUrl?: string }>;
  confirmPayment: (reference: string) => Promise<{ ok: boolean; message: string }>;
  addProduct: (input: ProductInput) => { ok: boolean; message: string };
  updateSellerProfile: (patch: Partial<User>) => void;
  advanceOrderStatus: (orderId: string) => void;
  markOrderCompleted: (orderId: string) => void;
  addReview: (productId: string, rating: number, comment: string) => { ok: boolean; message: string };
  createBulkRequest: (input: Omit<BulkRequest, "id" | "buyerId" | "buyerName" | "status" | "createdAt">) => { ok: boolean; message: string };
  createAdRequest: (type: "Homepage Banner" | "Sidebar Ad" | "Featured Listing", title: string, budget: number) => { ok: boolean; message: string };
  sendChatMessage: (receiverId: string, message: string) => { ok: boolean; message: string };
}

const AppContext = createContext<AppContextValue | null>(null);

const loadState = (): AppState => {
  if (typeof window === "undefined") {
    return initialAppState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialAppState;
    const loaded = JSON.parse(raw) as AppState;
    if (![loaded.users, loaded.products, loaded.orders, loaded.cart, loaded.reviews, loaded.bulkRequests, loaded.adRequests, loaded.chatMessages].every(Array.isArray)) return initialAppState;
    return {
      ...loaded,
      currentUserId: loaded.users.some(u => u.id === loaded.currentUserId) ? loaded.currentUserId : null,
      orders: loaded.orders.map(order => ({ ...order, paymentStatus: ["Paid", "Awaiting Payment", "Unverified"].includes(order.paymentStatus) ? order.paymentStatus : "Unverified" })),
    };
  } catch { return initialAppState; }
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AppState>(initialAppState);
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => { setState(loadState()); setIsHydrated(true); }, []);
  useEffect(() => {
    if (!isHydrated) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { toast.error("Your browser could not save changes. Enable site storage before checkout."); }
  }, [state, isHydrated]);

  const currentUser = state.users.find((user) => user.id === state.currentUserId) ?? null;
  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  const registerUser = (input: RegisterInput) => {
    const email = input.email.trim().toLowerCase();
    if (state.users.some((user) => user.email.toLowerCase() === email)) {
      return { ok: false, message: "An account with that email already exists." };
    }

    const user: User = {
      id: createId(input.role),
      role: input.role,
      name: input.name.trim(),
      email,
      phone: input.phone.trim(),
      password: input.password,
      location: input.location.trim(),
      storeName: input.storeName?.trim(),
      bio:
        input.role === "seller"
          ? "New seller on Farmyn. Update this store profile from your dashboard."
          : undefined,
      verified: input.role === "seller" ? false : true,
      emailVerified: true,
      joinedAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      users: [user, ...prev.users],
      currentUserId: user.id,
    }));

    return { ok: true, message: "Account created successfully.", user };
  };

  const login = (email: string, password: string) => {
    const user = state.users.find(
      (entry) =>
        entry.email.toLowerCase() === email.trim().toLowerCase() &&
        entry.password === password,
    );

    if (!user) {
      return { ok: false, message: "Invalid email or password." };
    }

    if (!user.emailVerified) {
      return { ok: false, message: "Please verify your email before logging in." };
    }

    setState((prev) => ({ ...prev, currentUserId: user.id }));
    return { ok: true, message: "Logged in successfully.", user };
  };

  const logout = () => {
    setState((prev) => ({ ...prev, currentUserId: null }));
    toast.success("You have been logged out.");
  };

  const addToCart = (productId: string) => {
    const product = state.products.find((entry) => entry.id === productId);
    if (!product || !product.inStock) {
      toast.error("This product is currently out of stock.");
      return;
    }

    setState((prev) => {
      const existing = prev.cart.find((item) => item.productId === productId);
      if (existing) {
        return {
          ...prev,
          cart: prev.cart.map((item) =>
            item.productId === productId
              ? {
                  ...item,
                  quantity: Math.min(item.quantity + 1, product.stockCount || item.quantity + 1),
                }
              : item,
          ),
        };
      }

      return {
        ...prev,
        cart: [...prev.cart, { productId, quantity: 1 }],
      };
    });

    toast.success("Added to cart.");
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = state.products.find(p => p.id === productId);
    if (!product || !Number.isSafeInteger(quantity)) return;
    quantity = Math.min(quantity, product.stockCount);
    setState((prev) => ({
      ...prev,
      cart: prev.cart.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    }));
  };

  const removeFromCart = (productId: string) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.filter((item) => item.productId !== productId),
    }));
  };

  const clearCart = () => {
    setState((prev) => ({ ...prev, cart: [] }));
  };

  const checkout = async (input: CheckoutInput) => {
    if (!isHydrated || !currentUser || currentUser.role !== "buyer") return { ok: false, message: "Log in as a buyer to check out." };
    if (input.deliveryAddress.trim().length < 5) return { ok: false, message: "Enter a complete delivery address." };
    if (!state.cart.length) return { ok: false, message: "Your cart is empty." };
    for (const item of state.cart) {
      const product = state.products.find(p => p.id === item.productId);
      if (!product || !product.inStock || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > product.stockCount) return { ok: false, message: "Check your cart quantities and stock availability." };
    }
    try {
      const result = await startCheckout({
        customer: { id: currentUser.id, name: currentUser.name, email: currentUser.email },
        items: state.cart, deliveryAddress: input.deliveryAddress.trim(), note: input.note?.trim() || "",
      });
      return { ok: true, message: "Opening Paystack secure checkout…", authorizationUrl: result.authorizationUrl };
    } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Checkout is unavailable. Please retry." }; }
  };

  const confirmPayment = async (reference: string) => {
    if (!currentUser || !/^farmyn_[a-f0-9]{32}$/.test(reference)) throw new Error("Sign in to verify a valid payment reference.");
    const receipt = await verifyCheckout(reference, currentUser.id);
    if (receipt.status !== "paid") return { ok: false, message: "Paystack has not confirmed a successful payment. Your cart is still saved. You can check again shortly." };
    if (!Array.isArray(receipt.orders) || !receipt.orders.length || receipt.orders.some(o => o.buyerId !== currentUser.id || o.paymentReference !== reference || o.paymentStatus !== "Paid")) throw new Error("The verified order details did not match your account.");
    setState(prev => {
      const fresh = receipt.orders.filter(order => !prev.orders.some(existing => existing.id === order.id));
      if (!fresh.length) return prev;
      const purchased = new Map<string, number>();
      fresh.forEach(order => order.items.forEach(item => purchased.set(item.productId, (purchased.get(item.productId) || 0) + item.quantity)));
      return {
        ...prev, orders: [...fresh, ...prev.orders],
        cart: prev.cart.map(item => ({ ...item, quantity: Math.max(0, item.quantity - (purchased.get(item.productId) || 0)) })).filter(item => item.quantity > 0),
        products: prev.products.map(product => {
          const stockCount = Math.max(0, product.stockCount - (purchased.get(product.id) || 0));
          return { ...product, stockCount, inStock: stockCount > 0 };
        }),
      };
    });
    return { ok: true, message: "Paystack verified your test payment. Your order is now saved and ready for seller confirmation." };
  };

  const addProduct = (input: ProductInput) => {
    if (!currentUser || currentUser.role !== "seller") {
      return { ok: false, message: "Log in as a seller to add products." };
    }

    const product: Product = {
      id: createId("product"),
      name: input.name.trim(),
      category: input.category,
      price: input.price,
      image: input.image.trim(),
      sellerId: currentUser.id,
      sellerName: currentUser.storeName || currentUser.name,
      sellerVerified: currentUser.verified,
      location: input.location.trim() || currentUser.location,
      rating: 0,
      reviewCount: 0,
      inStock: input.stockCount > 0,
      stockCount: input.stockCount,
      unit: input.unit.trim(),
      minimumOrder: input.minimumOrder.trim(),
      description: input.description.trim(),
      featured: false,
    };

    setState((prev) => ({
      ...prev,
      products: [product, ...prev.products],
    }));

    return { ok: true, message: "Product listed successfully." };
  };

  const updateSellerProfile = (patch: Partial<User>) => {
    if (!currentUser) {
      return;
    }

    setState((prev) => ({
      ...prev,
      users: prev.users.map((user) =>
        user.id === currentUser.id ? { ...user, ...patch } : user,
      ),
    }));

    toast.success("Profile updated.");
  };

  const advanceOrderStatus = (orderId: string) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((order) => {
        if (order.id !== orderId || !currentUser || currentUser.role !== "seller" || order.sellerId !== currentUser.id || order.paymentStatus !== "Paid" || order.status === "Delivered" || order.status === "Completed") {
          return order;
        }

        const index = orderStatusFlow.indexOf(order.status);
        const nextStatus = orderStatusFlow[Math.min(index + 1, orderStatusFlow.length - 1)];
        if (nextStatus === order.status) {
          return order;
        }

        return {
          ...order,
          status: nextStatus,
          paymentStatus: order.paymentStatus,
          timeline: [
            {
              label:
                nextStatus === "Preparing Order"
                  ? "Seller confirmed stock and started packing"
                  : nextStatus === "In Transit"
                    ? "Order moved in transit"
                    : nextStatus === "Delivered"
                      ? "Seller marked order delivered"
                      : "Buyer confirmation pending"
              ,
              date: new Date().toISOString(),
            },
            ...order.timeline,
          ],
        };
      }),
    }));
  };

  const markOrderCompleted = (orderId: string) => {
    const target = state.orders.find(order => order.id === orderId);
    if (!target || target.buyerId !== currentUser?.id || currentUser?.role !== "buyer" || target.status !== "Delivered" || target.paymentStatus !== "Paid") { toast.error("Only the buyer can confirm delivery of a paid, delivered order."); return; }
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((order) =>
        order.id === orderId && currentUser?.id === order.buyerId && currentUser.role === "buyer" && order.status === "Delivered" && order.paymentStatus === "Paid"
          ? {
              ...order,
              status: "Completed",
              paymentStatus: order.paymentStatus,
              timeline: [
                {
                  label: "Buyer confirmed delivery",
                  date: new Date().toISOString(),
                },
                ...order.timeline,
              ],
            }
          : order,
      ),
    }));

    toast.success("Delivery confirmation recorded. Seller settlement is handled separately.");
  };

  const addReview = (productId: string, rating: number, comment: string) => {
    if (!currentUser) {
      return { ok: false, message: "Log in to leave a review." };
    }

    const deliveredOrderExists = state.orders.some(
      (order) =>
        order.buyerId === currentUser.id &&
        (order.status === "Delivered" || order.status === "Completed") &&
        order.items.some((item) => item.productId === productId),
    );

    if (!deliveredOrderExists) {
      return { ok: false, message: "Only delivered orders can be reviewed." };
    }

    const review: Review = {
      id: createId("review"),
      productId,
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    setState((prev) => {
      const productReviews = [...prev.reviews.filter((entry) => entry.productId === productId), review];
      const average =
        productReviews.reduce((sum, entry) => sum + entry.rating, 0) / productReviews.length;

      return {
        ...prev,
        reviews: [review, ...prev.reviews],
        products: prev.products.map((product) =>
          product.id === productId
            ? {
                ...product,
                rating: average,
                reviewCount: productReviews.length,
              }
            : product,
        ),
      };
    });

    return { ok: true, message: "Review submitted." };
  };

  const createBulkRequest = (
    input: Omit<BulkRequest, "id" | "buyerId" | "buyerName" | "status" | "createdAt">,
  ) => {
    if (!currentUser || currentUser.role !== "buyer") {
      return { ok: false, message: "Only buyers can create bulk requests." };
    }

    const request: BulkRequest = {
      id: createId("bulk"),
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      title: input.title.trim(),
      category: input.category,
      quantity: input.quantity.trim(),
      budget: input.budget,
      location: input.location.trim(),
      notes: input.notes.trim(),
      status: "Open",
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      bulkRequests: [request, ...prev.bulkRequests],
    }));

    return { ok: true, message: "Bulk request published." };
  };

  const createAdRequest = (
    type: "Homepage Banner" | "Sidebar Ad" | "Featured Listing",
    title: string,
    budget: number,
  ) => {
    if (!currentUser || currentUser.role !== "seller") {
      return { ok: false, message: "Only sellers can request adverts." };
    }

    setState((prev) => ({
      ...prev,
      adRequests: [
        {
          id: createId("ad"),
          sellerId: currentUser.id,
          sellerName: currentUser.storeName || currentUser.name,
          type,
          title: title.trim(),
          budget,
          status: "Pending Approval",
          createdAt: new Date().toISOString(),
        },
        ...prev.adRequests,
      ],
    }));

    return { ok: true, message: "Advertisement request submitted." };
  };

  const sendChatMessage = (receiverId: string, message: string) => {
    if (!currentUser) {
      return { ok: false, message: "Please log in to send a message." };
    }

    const receiver = state.users.find((user) => user.id === receiverId);
    if (!receiver) {
      return { ok: false, message: "Recipient user not found." };
    }

    const newMessage: ChatMessage = {
      id: createId("chat"),
      senderId: currentUser.id,
      senderName: currentUser.role === "seller" ? (currentUser.storeName || currentUser.name) : currentUser.name,
      receiverId: receiver.id,
      receiverName: receiver.role === "seller" ? (receiver.storeName || receiver.name) : receiver.name,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      chatMessages: [...prev.chatMessages, newMessage],
    }));

    return { ok: true, message: "Message sent." };
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        currentUser,
        isHydrated,
        categories: [...allCategories],
        cartCount,
        registerUser,
        login,
        logout,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        checkout,
        confirmPayment,
        addProduct,
        updateSellerProfile,
        advanceOrderStatus,
        markOrderCompleted,
        addReview,
        createBulkRequest,
        createAdRequest,
        sendChatMessage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }

  return context;
};
