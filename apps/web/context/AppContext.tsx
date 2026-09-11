import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
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
  categories: string[];
  cartCount: number;
  registerUser: (input: RegisterInput) => { ok: boolean; message: string };
  login: (email: string, password: string) => { ok: boolean; message: string };
  logout: () => void;
  addToCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  checkout: (input: CheckoutInput) => { ok: boolean; message: string };
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

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return initialAppState;
  }

  try {
    return JSON.parse(raw) as AppState;
  } catch {
    return initialAppState;
  }
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AppState>(() => {
    const loaded = loadState();
    // Check if currentUserId is valid
    const currentUserValid = loaded.currentUserId ? loaded.users.some(u => u.id === loaded.currentUserId);
    if (!currentUserValid) {
      // Reset to initial state if current user is invalid
      return initialAppState;
    }
    return loaded;
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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

    return { ok: true, message: "Account created successfully." };
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
    return { ok: true, message: "Logged in successfully." };
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

  const checkout = (input: CheckoutInput) => {
    if (!currentUser || currentUser.role !== "buyer") {
      return { ok: false, message: "Log in as a buyer to place an order." };
    }

    if (!currentUser.emailVerified) {
      return { ok: false, message: "Verify your email before checking out." };
    }

    const cartProducts = state.cart
      .map((item) => ({
        item,
        product: state.products.find((product) => product.id === item.productId),
      }))
      .filter((entry): entry is { item: AppState["cart"][number]; product: Product } => Boolean(entry.product));

    if (cartProducts.length === 0) {
      return { ok: false, message: "Your cart is empty." };
    }

    const groupedBySeller = new Map<string, { sellerName: string; items: Order["items"] }>();

    cartProducts.forEach(({ item, product }) => {
      if (!groupedBySeller.has(product.sellerId)) {
        groupedBySeller.set(product.sellerId, {
          sellerName: product.sellerName,
          items: [],
        });
      }

      groupedBySeller.get(product.sellerId)?.items.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        sellerId: product.sellerId,
        sellerName: product.sellerName,
      });
    });

    const createdAt = new Date().toISOString();
    const orders: Order[] = Array.from(groupedBySeller.entries()).map(([sellerId, group]) => {
      const subtotal = group.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const commission = subtotal * 0.05;
      const deliveryFee = 2500;

      return {
        id: createId("order"),
        buyerId: currentUser.id,
        buyerName: currentUser.name,
        sellerId,
        sellerName: group.sellerName,
        items: group.items,
        subtotal,
        commission,
        deliveryFee,
        total: subtotal + commission + deliveryFee,
        deliveryAddress: input.deliveryAddress.trim(),
        note: input.note?.trim(),
        status: "Pending Seller Confirmation",
        paymentStatus: "Held in Escrow",
        createdAt,
        timeline: [
          {
            label: "Order placed and payment moved into escrow",
            date: createdAt,
          },
        ],
      };
    });

    setState((prev) => ({
      ...prev,
      orders: [...orders, ...prev.orders],
      cart: [],
    }));

    return { ok: true, message: `${orders.length} escrow-protected order(s) created.` };
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
        if (order.id !== orderId) {
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
          paymentStatus:
            nextStatus === "Completed" ? "Released to Seller" : order.paymentStatus,
          timeline: [
            {
              label:
                nextStatus === "Preparing Order"
                  ? "Seller confirmed stock and started packing"
                  : nextStatus === "In Transit"
                    ? "Order moved in transit"
                    : nextStatus === "Delivered"
                      ? "Seller marked order delivered"
                      : "Escrow released to seller after buyer confirmation"
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
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "Completed",
              paymentStatus: "Released to Seller",
              timeline: [
                {
                  label: "Buyer confirmed delivery and escrow was released",
                  date: new Date().toISOString(),
                },
                ...order.timeline,
              ],
            }
          : order,
      ),
    }));

    toast.success("Order completed and escrow released.");
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
        categories: allCategories,
        cartCount,
        registerUser,
        login,
        logout,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        checkout,
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
