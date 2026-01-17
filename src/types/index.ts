// Re-export database types
export * from './database';

// Application-level types
import type { Tables } from './database';

// =====================================
// Entity Types (from database)
// =====================================
export type Profile = Tables<'profiles'>;
export type Category = Tables<'categories'>;
export type Product = Tables<'products'>;
export type LicenseKey = Tables<'license_keys'>;
export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;
export type CartItem = Tables<'cart_items'>;
export type WishlistItem = Tables<'wishlist'>;
export type Review = Tables<'reviews'>;
export type Coupon = Tables<'coupons'>;
export type CouponUsage = Tables<'coupon_usage'>;
export type Deal = Tables<'deals'>;

// =====================================
// Extended Types (with relations)
// =====================================
export type ProductWithCategory = Product & {
    category: Category | null;
};

export type CartItemWithProduct = CartItem & {
    product: Product;
};

export type WishlistItemWithProduct = WishlistItem & {
    product: Product;
};

export type OrderWithItems = Order & {
    items: OrderItem[];
};

export type ReviewWithUser = Review & {
    user: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
};

export type DealWithProduct = Deal & {
    product: Product;
};

// =====================================
// API Response Types
// =====================================
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// =====================================
// Request/Query Types
// =====================================
export interface ProductFilters {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    rating?: number;
    inStock?: boolean;
    featured?: boolean;
    sortBy?: 'price_asc' | 'price_desc' | 'name' | 'rating' | 'newest' | 'bestseller';
    search?: string;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
}

// =====================================
// Cart Types
// =====================================
export interface CartState {
    items: CartItemWithProduct[];
    itemCount: number;
    subtotal: number;
    discount: number;
    total: number;
    couponCode?: string;
    couponDiscount: number;
}

export interface AddToCartInput {
    productId: string;
    quantity?: number;
}

// =====================================
// Checkout Types
// =====================================
export interface BillingInfo {
    name: string;
    email: string;
    phone?: string;
    address?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    };
}

export interface CheckoutInput {
    billing: BillingInfo;
    couponCode?: string;
    customerNotes?: string;
}

export interface PaymentVerification {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

// =====================================
// UI State Types
// =====================================
export interface UIState {
    isCartOpen: boolean;
    isMobileMenuOpen: boolean;
    isSearchOpen: boolean;
    theme: 'light' | 'dark' | 'system';
}

// =====================================
// Auth Types
// =====================================
export interface AuthUser {
    id: string;
    email: string;
    profile: Profile | null;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface RegisterInput {
    email: string;
    password: string;
    fullName: string;
    referralCode?: string;
}
