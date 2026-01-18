"use client";

import Link from 'next/link';
import { Monitor, FileText, Shield, Palette, Settings, Gamepad2, LucideIcon } from 'lucide-react';

interface Category {
    name: string;
    slug: string;
    icon: LucideIcon;
    gradient: string;
}

const categories: Category[] = [
    {
        name: 'Operating Systems',
        slug: 'operating-systems',
        icon: Monitor,
        gradient: 'from-blue-500 to-cyan-400'
    },
    {
        name: 'Office Suites',
        slug: 'office-suites',
        icon: FileText,
        gradient: 'from-orange-500 to-red-400'
    },
    {
        name: 'Antivirus',
        slug: 'antivirus',
        icon: Shield,
        gradient: 'from-emerald-500 to-teal-400'
    },
    {
        name: 'Design Tools',
        slug: 'design-software',
        icon: Palette,
        gradient: 'from-purple-500 to-pink-400'
    },
    {
        name: 'Utilities',
        slug: 'utilities',
        icon: Settings,
        gradient: 'from-slate-500 to-gray-400'
    },
    {
        name: 'Games',
        slug: 'games',
        icon: Gamepad2,
        gradient: 'from-violet-500 to-indigo-400'
    },
];

export function CategoryGrid() {
    return (
        <section className="container-dense mb-12">
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full"></span>
                Browse by Category
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.map((cat) => {
                    const IconComponent = cat.icon;
                    return (
                        <Link key={cat.slug} href={`/products?category=${cat.slug}`} className="group">
                            <div className="bg-card border h-40 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary hover:shadow-lg transition-all p-4">
                                <div className={`relative w-16 h-16 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                    <IconComponent className="w-8 h-8 text-white" strokeWidth={1.5} />
                                </div>
                                <span className="font-medium text-sm text-center group-hover:text-primary transition-colors">
                                    {cat.name}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
