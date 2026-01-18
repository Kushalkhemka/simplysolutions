'use client';

import { Star, ThumbsUp, CheckCircle } from 'lucide-react';
import { useMemo } from 'react';

interface ProductReviewsProps {
    productId: string;
    productName: string;
    productType?: string;
}

// Names pool for generating reviewer names
const FIRST_NAMES = [
    'Rahul', 'Priya', 'Amit', 'Neha', 'Vikram', 'Pooja', 'Arjun', 'Kavita',
    'Suresh', 'Anjali', 'Raj', 'Sneha', 'Arun', 'Divya', 'Manish', 'Ritu',
    'Deepak', 'Meena', 'Sanjay', 'Swati', 'Nikhil', 'Preeti', 'Aakash', 'Jyoti'
];

const LAST_INITIALS = ['S', 'K', 'P', 'R', 'M', 'V', 'T', 'G', 'B', 'D', 'N', 'A'];

// Review templates for different product types
const REVIEW_TEMPLATES = {
    office: [
        { rating: 5, title: "Works perfectly!", text: "Genuine license key delivered instantly. Activated without any issues. Very happy with the purchase!" },
        { rating: 5, title: "Excellent product and service", text: "Got my Office license within minutes of payment. Easy activation process. Highly recommended seller!" },
        { rating: 4, title: "Good value for money", text: "Product is genuine and works well. Activation was smooth. Saved a lot compared to retail price." },
        { rating: 5, title: "Fast delivery, genuine product", text: "Key was delivered immediately after payment. Installation and activation went smoothly. Great experience!" },
        { rating: 5, title: "Best deal on the market", text: "I was skeptical at first but this is 100% genuine. Office activated perfectly and works great on my PC." },
        { rating: 4, title: "Satisfied customer", text: "Product works as described. The key activated on the first try. Good customer support too." },
        { rating: 5, title: "Lifetime license - Amazing!", text: "Genuine lifetime license at fraction of original price. No subscription hassle. Absolutely worth it!" },
        { rating: 5, title: "Perfect for students and professionals", text: "All Office apps working flawlessly. Word, Excel, PowerPoint - everything activated properly." },
    ],
    windows: [
        { rating: 5, title: "Genuine Windows activation", text: "Windows activated successfully. No watermark, all features unlocked. Fantastic deal!" },
        { rating: 5, title: "Quick and easy activation", text: "Received key instantly. Activated my Windows in minutes. 100% genuine product." },
        { rating: 4, title: "Great value", text: "Windows running perfectly after activation. All updates working fine. Worth every rupee!" },
        { rating: 5, title: "Hassle-free experience", text: "Simple process - got the key, entered it, and Windows was activated. Excellent service!" },
        { rating: 5, title: "Best Windows deal online", text: "Saved thousands compared to buying from Microsoft directly. Same genuine product!" },
        { rating: 5, title: "Works on fresh install too", text: "Used the key for fresh Windows installation. Activated without any problems at all." },
        { rating: 4, title: "Reliable seller", text: "This is my second purchase from here. Both keys worked perfectly. Trusted seller!" },
        { rating: 5, title: "All features unlocked", text: "Full Windows Pro features available after activation. Personalization, BitLocker - everything works!" },
    ],
    default: [
        { rating: 5, title: "Excellent product!", text: "Received the product key instantly. Activated without any issues. Very satisfied with my purchase!" },
        { rating: 5, title: "Fast delivery, great service", text: "Key delivered within minutes. Activation was smooth and easy. Highly recommend this seller!" },
        { rating: 4, title: "Good value for money", text: "Product is genuine and works exactly as described. Saved a lot compared to retail pricing." },
        { rating: 5, title: "100% genuine license", text: "Was worried about buying online but this is completely legitimate. Working perfectly!" },
        { rating: 5, title: "Great customer support", text: "Had a small issue and support helped me resolve it quickly. Product works great now!" },
        { rating: 4, title: "Recommended", text: "Good experience overall. The license key worked on the first attempt. Would buy again." },
        { rating: 5, title: "Lifetime license at great price", text: "Best deal I found online. Genuine license at a fraction of the cost. Very happy!" },
        { rating: 5, title: "Quick and reliable", text: "Super fast delivery and genuine product. Installation went smoothly. 5 stars!" },
    ],
};

// Dates for reviews (relative days ago)
const REVIEW_DATES = [3, 7, 12, 18, 25, 32, 45, 60, 75, 90];

// Generate deterministic hash
function getHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash);
}

// Format relative date
function formatRelativeDate(daysAgo: number): string {
    if (daysAgo < 7) return `${daysAgo} days ago`;
    if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
    if (daysAgo < 60) return '1 month ago';
    return `${Math.floor(daysAgo / 30)} months ago`;
}

// Get product type from name
function getProductType(productName: string): 'office' | 'windows' | 'default' {
    const lower = productName.toLowerCase();
    if (lower.includes('office') || lower.includes('365') || lower.includes('word') || lower.includes('excel')) {
        return 'office';
    }
    if (lower.includes('windows') || lower.includes('win11') || lower.includes('win10')) {
        return 'windows';
    }
    return 'default';
}

export default function ProductReviews({ productId, productName, productType }: ProductReviewsProps) {
    const reviews = useMemo(() => {
        const type = (productType || getProductType(productName)) as keyof typeof REVIEW_TEMPLATES;
        const templates = REVIEW_TEMPLATES[type] || REVIEW_TEMPLATES.default;
        const hash = getHash(productId);

        // Select 5-8 reviews based on product hash
        const numReviews = 5 + (hash % 4);
        const selectedReviews = [];

        for (let i = 0; i < numReviews; i++) {
            const templateIndex = (hash + i * 7) % templates.length;
            const nameIndex = (hash + i * 13) % FIRST_NAMES.length;
            const lastInitIndex = (hash + i * 5) % LAST_INITIALS.length;
            const dateIndex = (hash + i * 3) % REVIEW_DATES.length;
            const helpfulCount = 5 + ((hash + i * 17) % 46); // 5-50 helpful votes

            selectedReviews.push({
                id: i,
                reviewer: `${FIRST_NAMES[nameIndex]} ${LAST_INITIALS[lastInitIndex]}.`,
                rating: templates[templateIndex].rating,
                title: templates[templateIndex].title,
                text: templates[templateIndex].text,
                date: formatRelativeDate(REVIEW_DATES[dateIndex]),
                helpful: helpfulCount,
                verified: true,
            });
        }

        return selectedReviews;
    }, [productId, productName, productType]);

    // Calculate rating distribution
    const ratingDist = useMemo(() => {
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(r => {
            dist[r.rating as keyof typeof dist]++;
        });
        const total = reviews.length;
        return Object.entries(dist).reverse().map(([stars, count]) => ({
            stars: parseInt(stars),
            count,
            percent: Math.round((count / total) * 100),
        }));
    }, [reviews]);

    const avgRating = useMemo(() => {
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return (sum / reviews.length).toFixed(1);
    }, [reviews]);

    return (
        <div className="bg-white rounded-lg border border-[#DDD] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-b from-[#F7F8FA] to-[#E7E9EC] px-6 py-4 border-b border-[#DDD]">
                <h2 className="text-lg font-bold text-[#0F1111]">Customer Reviews</h2>
            </div>

            <div className="p-6">
                {/* Rating Summary */}
                <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b border-[#DDD]">
                    {/* Overall Rating */}
                    <div className="flex flex-col items-center md:items-start">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-3xl font-bold text-[#0F1111]">{avgRating}</span>
                            <span className="text-lg text-[#565959]">out of 5</span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-5 h-5 ${star <= Math.round(parseFloat(avgRating))
                                        ? 'fill-[#FFA41C] text-[#FFA41C]'
                                        : 'fill-[#E7E9EC] text-[#E7E9EC]'
                                        }`}
                                />
                            ))}
                        </div>
                        <p className="text-sm text-[#007185]">{reviews.length} global ratings</p>
                    </div>

                    {/* Rating Bars */}
                    <div className="flex-1 space-y-2">
                        {ratingDist.map(({ stars, percent }) => (
                            <div key={stars} className="flex items-center gap-3">
                                <span className="text-sm text-[#007185] w-16 hover:underline cursor-pointer">
                                    {stars} star
                                </span>
                                <div className="flex-1 h-5 bg-[#E7E9EC] rounded overflow-hidden">
                                    <div
                                        className="h-full bg-[#FFA41C] transition-all"
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                                <span className="text-sm text-[#007185] w-10">{percent}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-6">
                    <h3 className="font-bold text-[#0F1111] text-base">Top reviews from India</h3>

                    {reviews.map((review) => (
                        <div key={review.id} className="border-b border-[#DDD] pb-6 last:border-b-0">
                            {/* Reviewer */}
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-[#232F3E] flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                        {review.reviewer.charAt(0)}
                                    </span>
                                </div>
                                <span className="text-sm text-[#0F1111] font-medium">{review.reviewer}</span>
                            </div>

                            {/* Rating & Title */}
                            <div className="flex items-center gap-2 mb-1">
                                <div className="flex items-center">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-4 h-4 ${star <= review.rating
                                                ? 'fill-[#FFA41C] text-[#FFA41C]'
                                                : 'fill-[#E7E9EC] text-[#E7E9EC]'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="font-bold text-sm text-[#0F1111]">{review.title}</span>
                            </div>

                            {/* Date & Verified */}
                            <div className="flex items-center gap-3 mb-3 text-xs text-[#565959]">
                                <span>Reviewed in India {review.date}</span>
                                {review.verified && (
                                    <span className="flex items-center gap-1 text-[#C45500] font-medium">
                                        <CheckCircle className="w-3 h-3" />
                                        Verified Purchase
                                    </span>
                                )}
                            </div>

                            {/* Review Text */}
                            <p className="text-sm text-[#0F1111] leading-relaxed mb-3">
                                {review.text}
                            </p>

                            {/* Helpful */}
                            <div className="flex items-center gap-4">
                                <button className="text-xs text-[#565959] hover:text-[#0F1111] flex items-center gap-1">
                                    <ThumbsUp className="w-3 h-3" />
                                    Helpful ({review.helpful})
                                </button>
                                <button className="text-xs text-[#565959] hover:text-[#0F1111]">
                                    Report
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
