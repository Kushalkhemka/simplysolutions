"use client";

import Link from 'next/link';
import Image from 'next/image';

const categories = [
    { name: 'Operating Systems', slug: 'operating-systems', icon: '/assets/icons/windows.png' },
    { name: 'Office Suites', slug: 'office-suites', icon: '/assets/icons/office.png' },
    { name: 'Antivirus', slug: 'antivirus', icon: '/assets/icons/antivirus.png' },
    { name: 'Design Tools', slug: 'design-software', icon: '/assets/icons/design.png' },
    { name: 'Utilities', slug: 'utilities', icon: '/assets/icons/utilities.png' },
    { name: 'Games', slug: 'games', icon: '/assets/icons/games.png' },
];

export function CategoryGrid() {
    return (
        <section className="container-dense mb-12">
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full"></span>
                Browse by Category
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.map((cat) => (
                    <Link key={cat.slug} href={`/products?category=${cat.slug}`} className="group">
                        <div className="bg-card border h-40 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary hover:shadow-lg transition-all p-4">
                            <div className="relative w-20 h-20 group-hover:scale-110 transition-transform duration-300">
                                <Image
                                    src={cat.icon}
                                    alt={cat.name}
                                    fill
                                    className="object-contain drop-shadow-md"
                                />
                            </div>
                            <span className="font-medium text-sm text-center group-hover:text-primary transition-colors">
                                {cat.name}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
