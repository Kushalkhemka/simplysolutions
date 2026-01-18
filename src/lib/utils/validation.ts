import { z } from 'zod';

// =====================================
// Product Schemas
// =====================================
export const productFiltersSchema = z.object({
    category: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    brand: z.string().optional(),
    rating: z.coerce.number().min(1).max(5).optional(),
    inStock: z.coerce.boolean().optional(),
    featured: z.coerce.boolean().optional(),
    sortBy: z.enum(['price_asc', 'price_desc', 'name', 'rating', 'newest', 'bestseller']).optional(),
    search: z.string().optional(),
});

// =====================================
// Cart Schemas
// =====================================
export const addToCartSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().min(1).max(10).default(1),
});

export const updateCartItemSchema = z.object({
    quantity: z.coerce.number().min(1).max(10),
});

// =====================================
// Checkout Schemas
// =====================================
export const billingInfoSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    gstn: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTN format').optional().or(z.literal('')),
    address: z.object({
        line1: z.string().min(5, 'Address line 1 is required'),
        line2: z.string().optional(),
        city: z.string().min(2, 'City is required'),
        state: z.string().min(2, 'State is required'),
        postalCode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid PIN code'),
        country: z.string().default('IN'),
    }),
});

export const checkoutSchema = z.object({
    billing: billingInfoSchema,
    couponCode: z.string().optional(),
    customerNotes: z.string().max(500).optional(),
    loyaltyPointsToUse: z.coerce.number().min(0).optional(),
});

export const paymentVerificationSchema = z.object({
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
});

// =====================================
// Review Schemas
// =====================================
export const createReviewSchema = z.object({
    productId: z.string().uuid(),
    rating: z.coerce.number().min(1).max(5),
    title: z.string().max(100).optional(),
    content: z.string().max(2000).optional(),
    pros: z.array(z.string().max(100)).max(5).optional(),
    cons: z.array(z.string().max(100)).max(5).optional(),
});

export const updateReviewSchema = z.object({
    rating: z.coerce.number().min(1).max(5).optional(),
    title: z.string().max(100).optional(),
    content: z.string().max(2000).optional(),
    pros: z.array(z.string().max(100)).max(5).optional(),
    cons: z.array(z.string().max(100)).max(5).optional(),
});

// =====================================
// Auth Schemas
// =====================================
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    referralCode: z.string().optional(),
});

export const updateProfileSchema = z.object({
    fullName: z.string().min(2).optional(),
    phone: z.string().optional(),
    avatarUrl: z.string().url().optional(),
});

// =====================================
// Coupon Schemas
// =====================================
export const validateCouponSchema = z.object({
    code: z.string().min(1, 'Coupon code is required'),
    subtotal: z.coerce.number().min(0),
    itemCount: z.coerce.number().min(1),
});

// =====================================
// Admin Schemas
// =====================================
export const createProductSchema = z.object({
    sku: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    shortDescription: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    price: z.coerce.number().min(0),
    mrp: z.coerce.number().min(0),
    mainImageUrl: z.string().url().optional(),
    imageUrls: z.array(z.string().url()).optional(),
    bulletPoints: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
});

export const uploadLicenseKeysSchema = z.object({
    productId: z.string().uuid(),
    licenseKeys: z.array(z.string().min(1)).min(1, 'At least one license key is required'),
});

export const createCouponSchema = z.object({
    code: z.string().min(1).max(20),
    description: z.string().optional(),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.coerce.number().min(0),
    maxDiscountAmount: z.coerce.number().min(0).optional(),
    minOrderAmount: z.coerce.number().min(0).default(0),
    usageLimit: z.coerce.number().min(1).optional(),
    perUserLimit: z.coerce.number().min(1).default(1),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
    isActive: z.boolean().default(true),
});

export const createDealSchema = z.object({
    productId: z.string().uuid(),
    dealType: z.enum(['lightning', 'daily', 'weekly', 'flash', 'clearance']).default('lightning'),
    title: z.string().optional(),
    description: z.string().optional(),
    discountPercentage: z.coerce.number().min(1).max(100),
    dealPrice: z.coerce.number().min(0),
    originalPrice: z.coerce.number().min(0),
    quantityLimit: z.coerce.number().min(1).optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
});

// =====================================
// Pagination Schema
// =====================================
export const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
});

// =====================================
// Type exports
// =====================================
export type ProductFilters = z.infer<typeof productFiltersSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type CreateDealInput = z.infer<typeof createDealSchema>;
