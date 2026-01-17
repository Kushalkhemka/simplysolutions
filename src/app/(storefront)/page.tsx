import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'; // Using SSR import for server component
import { ProductCard } from '@/components/product/ProductCard';
import { HeroGrid } from '@/components/home/HeroGrid';
import { BannerSlider } from '@/components/home/BannerSlider';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import PartnershipSection from '@/components/home/PartnershipSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { HelpBanner } from '@/components/home/HelpBanner';
import { BrandSlider } from '@/components/home/BrandSlider';

import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { FeaturesStrip } from '@/components/home/FeaturesStrip';
import { PopularCategories } from '@/components/home/PopularCategories';
import { TrustpilotWidget } from '@/components/home/TrustpilotWidget';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { createClient } from '@/lib/supabase/server';
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd';

async function getProducts(query: any, limit = 4) {
    const supabase = await createClient();
    let builder = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

    if (query.is_featured) builder = builder.eq('is_featured', true);
    if (query.is_bestseller) builder = builder.eq('is_bestseller', true);

    // If no specific filter, order by created_at desc
    if (Object.keys(query).length === 0) {
        builder = builder.order('created_at', { ascending: false });
    }

    const { data } = await builder.limit(limit);
    return { data };
}

export default async function HomePage() {
    const { data: featuredProducts } = await getProducts({ is_featured: true }, 8);
    const { data: bestsellers } = await getProducts({ is_bestseller: true }, 8);
    const { data: newArrivals } = await getProducts({}, 8); // Just latest

    return (
        <>
            {/* JSON-LD Structured Data */}
            <OrganizationJsonLd />
            <WebSiteJsonLd />

            <div className="bg-background min-h-screen pb-12">
                {/* 0. Trustpilot Widget (Top Strip) */}
                <TrustpilotWidget />

                {/* 1. Hero Grid Section */}
                <HeroGrid />

                {/* 2. Partners Strip - Removed in favor of infinite slider at bottom */}
                {/* <PartnersStrip /> */}

                {/* Features Strip */}
                <FeaturesStrip />

                {/* Popular Categories Carousel */}
                <PopularCategories />

                {/* 1.5. New Deals Banner Slider */}
                <BannerSlider products={featuredProducts ?? undefined} />

                {/* 3. Categories Grid */}
                <CategoryGrid />

                {/* 4. Partnership & Loyalty Section (New) */}
                <PartnershipSection />

                {/* 4.5. Why Choose Us Section (New) */}
                <WhyChooseUs />

                {/* 5. Best Sellers (Dense Grid) */}
                {bestsellers && bestsellers.length > 0 && (
                    <section className="container-dense mb-12">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                                Top Selling Software
                            </h3>
                            <Link href="/products?sortBy=bestseller" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                                View All <ArrowRight size={16} weight="bold" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {bestsellers.slice(0, 12).map((product: any) => (
                                <ProductCard key={product.id} product={product} variant="default" />
                            ))}
                        </div>
                    </section>
                )}

                {/* 6. How It Works Section */}
                <HowItWorks />

                {/* 7. Horizontal Trending (Featured) */}
                {featuredProducts && featuredProducts.length > 0 && (
                    <section className="container-dense mb-12">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                Trending Now
                            </h3>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-xl border">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {featuredProducts.slice(0, 4).map((product: any) => (
                                    <ProductCard key={product.id} product={product} variant="horizontal" />
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* 8. Help Banner - Moved to bottom */}
                {/* <HelpBanner /> */}

                {/* 9. Customer Testimonials */}
                <TestimonialsSection />

                {/* 9. New Arrivals */}
                {newArrivals && newArrivals.length > 0 && (
                    <section className="container-dense mb-12">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                                New Arrivals
                            </h3>
                            <Link href="/products?sortBy=newest" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                                View All <ArrowRight size={16} weight="bold" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {newArrivals.slice(0, 5).map((product: any) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </section>
                )}


                {/* 10. Help Banner */}
                <HelpBanner />

                {/* 11. New Brand Slider */}
                <BrandSlider />
            </div>
        </>
    );
}
