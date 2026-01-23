import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { BLOG_POSTS } from '@/data/blog-posts';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { Calendar, User, Clock, ArrowLeft } from 'lucide-react';
import Script from 'next/script';

interface BlogPostPageProps {
    params: Promise<{ slug: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://simplysolutions.co.in';

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = BLOG_POSTS.find((p) => p.slug === slug);

    if (!post) return { title: 'Article Not Found' };

    return {
        title: post.title,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            type: 'article',
            url: `${BASE_URL}/blog/${slug}`,
            images: [post.image],
            publishedTime: post.publishedAt,
            authors: [post.author.name],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt,
            images: [post.image],
        },
        alternates: {
            canonical: `${BASE_URL}/blog/${slug}`,
        },
    };
}

// Article Schema
function ArticleJsonLd({ post }: { post: typeof BLOG_POSTS[0] }) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt,
        image: post.image,
        datePublished: post.publishedAt,
        dateModified: post.publishedAt,
        author: {
            '@type': 'Person',
            name: post.author.name,
        },
        publisher: {
            '@type': 'Organization',
            name: 'SimplySolutions',
            logo: {
                '@type': 'ImageObject',
                url: `${BASE_URL}/logo.png`,
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${BASE_URL}/blog/${post.slug}`,
        },
    };

    return (
        <Script
            id="article-jsonld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            strategy="afterInteractive"
        />
    );
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params;
    const post = BLOG_POSTS.find((p) => p.slug === slug);

    if (!post) {
        notFound();
    }

    const breadcrumbItems = [
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blog' },
        { name: post.title, url: `/blog/${post.slug}` },
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <BreadcrumbJsonLd items={breadcrumbItems} />
            <ArticleJsonLd post={post} />

            <div className="max-w-4xl mx-auto">
                {/* Back Link */}
                <Link href="/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Blog
                </Link>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">{post.title}</h1>

                    <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted">
                                <Image src="/logo-icon.png" alt={post.author.name} fill className="object-cover" />
                            </div>
                            <span className="font-medium text-foreground">{post.author.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4" />
                            {new Date(post.publishedAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4" />
                            5 min read
                        </div>
                    </div>
                </div>

                {/* Featured Image */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-12 bg-muted">
                    <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Content */}
                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <ReactMarkdown
                        components={{
                            h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-8 mb-4 scroll-mt-24" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-xl font-bold mt-6 mb-3" {...props} />,
                            p: ({ node, ...props }) => <p className="leading-relaxed mb-6" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-6 space-y-2" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-6 space-y-2" {...props} />,
                            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                            a: ({ node, ...props }) => <a className="text-primary hover:underline font-medium" {...props} />,
                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary pl-4 italic my-6" {...props} />,
                            table: ({ node, ...props }) => <div className="overflow-x-auto my-8"><table className="w-full border-collapse text-left" {...props} /></div>,
                            th: ({ node, ...props }) => <th className="border-b-2 border-border p-3 font-bold bg-muted/50" {...props} />,
                            td: ({ node, ...props }) => <td className="border-b border-border p-3" {...props} />,
                        }}
                    >
                        {post.content}
                    </ReactMarkdown>
                </div>

                {/* CTA */}
                <div className="mt-16 p-8 bg-primary/5 rounded-2xl border border-primary/20 text-center">
                    <h3 className="text-2xl font-bold mb-3">Ready to upgrade your software?</h3>
                    <p className="text-muted-foreground mb-6 max-w-lg mx-auto">Get genuine Microsoft licenses with instant delivery and lifetime validity from SimplySolutions.</p>
                    <Link
                        href="/products"
                        className="inline-flex items-center justify-center h-11 px-8 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                    >
                        Shop Now
                    </Link>
                </div>
            </div>
        </div>
    );
}
