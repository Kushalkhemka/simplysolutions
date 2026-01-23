import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { BLOG_POSTS } from '@/data/blog-posts';
import { ArrowRight, Calendar, User } from 'lucide-react';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://simplysolutions.co.in';

export const metadata: Metadata = {
    title: 'Knowledge Hub - Software Guides & Tips | SimplySolutions',
    description: 'Expert guides, installation tutorials, and software comparisons to help you make informed decisions. Learn about genuine Microsoft licenses.',
    openGraph: {
        title: 'Knowledge Hub - SimplySolutions',
        description: 'Expert guides, installation tutorials, and software comparisons to help you make informed decisions.',
        type: 'website',
        url: `${BASE_URL}/blog`,
    },
    alternates: {
        canonical: `${BASE_URL}/blog`,
    },
};

export default function BlogIndexPage() {
    const breadcrumbItems = [
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blog' },
    ];

    return (
        <div className="container mx-auto px-4 py-12">
            <BreadcrumbJsonLd items={breadcrumbItems} />

            <div className="text-center max-w-2xl mx-auto mb-16">
                <h1 className="text-4xl font-bold mb-4">Knowledge Hub</h1>
                <p className="text-muted-foreground text-lg">
                    Expert advice, installation guides, and tips to get the most out of your software.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {BLOG_POSTS.map((post) => (
                    <article key={post.slug} className="group flex flex-col border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow bg-card">
                        <Link href={`/blog/${post.slug}`} className="relative h-48 w-full overflow-hidden">
                            <Image
                                src={post.image}
                                alt={post.title}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                        </Link>
                        <div className="p-6 flex flex-col flex-1">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(post.publishedAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {post.author.name}
                                </div>
                            </div>
                            <h2 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                                <Link href={`/blog/${post.slug}`}>
                                    {post.title}
                                </Link>
                            </h2>
                            <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1">
                                {post.excerpt}
                            </p>
                            <Link
                                href={`/blog/${post.slug}`}
                                className="inline-flex items-center text-primary font-medium text-sm hover:underline mt-auto"
                            >
                                Read Article <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
