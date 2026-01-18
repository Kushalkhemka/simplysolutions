'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { ChevronRight, Flame, HelpCircle } from 'lucide-react';
import { megaMenuCategories, currencies, languages, type MegaMenuCategory } from './MegaMenuData';

// Inline SVG Icon component
function MenuIcon({ path, viewBox, className }: { path: string; viewBox: string; className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={viewBox}
            className={className}
            fill="currentColor"
        >
            <path d={path} />
        </svg>
    );
}

// Top Utility Bar with promo, currency, language switchers
export function TopUtilityBar() {
    const [showCurrency, setShowCurrency] = useState(false);
    const [showLanguage, setShowLanguage] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);
    const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);

    const currencyRef = useRef<HTMLDivElement>(null);
    const languageRef = useRef<HTMLDivElement>(null);

    // Click outside to close dropdowns
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
                setShowCurrency(false);
            }
            if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
                setShowLanguage(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="bg-gradient-to-r from-[#1a1c23] via-[#252832] to-[#1a1c23] text-white text-[11px] py-1.5 hidden md:block relative">
            {/* Subtle animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-orange-500/5 animate-pulse" />

            <div className="container-dense flex items-center justify-between relative z-10">
                {/* Left: Hot Promo */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-red-500/20 animate-pulse">
                            <Flame className="h-3 w-3 fill-current" />
                            Hot
                        </span>
                        <span className="font-medium text-white/90 tracking-wide">
                            Get <span className="text-orange-400 font-bold">100% Cashback</span> on Every Order!
                        </span>
                    </div>
                </div>

                {/* Right: Currency, Language, Help */}
                <div className="flex items-center gap-1">
                    {/* Currency Switcher */}
                    <div className="relative" ref={currencyRef}>
                        <button
                            onClick={() => { setShowCurrency(!showCurrency); setShowLanguage(false); }}
                            className="flex items-center gap-1.5 px-3 py-1 hover:bg-white/10 rounded transition-colors font-medium"
                        >
                            <span>{selectedCurrency.symbol}</span>
                            <span>{selectedCurrency.code}</span>
                            <ChevronRight className={`h-2.5 w-2.5 transition-transform ${showCurrency ? 'rotate-90' : ''}`} />
                        </button>
                        {showCurrency && (
                            <div className="absolute top-full right-0 mt-1 bg-[#1a1c23] border border-white/10 rounded-lg shadow-xl py-1 min-w-[120px] z-50">
                                {currencies.map((curr) => (
                                    <button
                                        key={curr.code}
                                        onClick={() => { setSelectedCurrency(curr); setShowCurrency(false); }}
                                        className={`w-full px-3 py-1.5 text-left hover:bg-white/10 flex items-center gap-2 ${selectedCurrency.code === curr.code ? 'text-orange-400' : 'text-white/80'}`}
                                    >
                                        <span>{curr.symbol}</span>
                                        <span>{curr.code}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <span className="w-px h-3 bg-white/20" />

                    {/* Language Switcher */}
                    <div className="relative" ref={languageRef}>
                        <button
                            onClick={() => { setShowLanguage(!showLanguage); setShowCurrency(false); }}
                            className="flex items-center gap-1.5 px-3 py-1 hover:bg-white/10 rounded transition-colors font-medium"
                        >
                            <span>{selectedLanguage.flag}</span>
                            <span>{selectedLanguage.code.toUpperCase()}</span>
                            <ChevronRight className={`h-2.5 w-2.5 transition-transform ${showLanguage ? 'rotate-90' : ''}`} />
                        </button>
                        {showLanguage && (
                            <div className="absolute top-full right-0 mt-1 bg-[#1a1c23] border border-white/10 rounded-lg shadow-xl py-1 min-w-[140px] z-50">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => { setSelectedLanguage(lang); setShowLanguage(false); }}
                                        className={`w-full px-3 py-1.5 text-left hover:bg-white/10 flex items-center gap-2 ${selectedLanguage.code === lang.code ? 'text-orange-400' : 'text-white/80'}`}
                                    >
                                        <span>{lang.flag}</span>
                                        <span>{lang.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <span className="w-px h-3 bg-white/20" />

                    {/* Need Help */}
                    <Link
                        href="/help"
                        className="flex items-center gap-1.5 px-3 py-1 hover:bg-white/10 rounded transition-colors font-medium text-white/80 hover:text-white"
                    >
                        <HelpCircle className="h-3.5 w-3.5 fill-current" />
                        <span>Need Help?</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

// Individual Mega Menu Item
function MegaMenuItem({ category, isActive, onMouseEnter, onMouseLeave }: {
    category: MegaMenuCategory;
    isActive: boolean;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}) {
    const isBundle = category.id === 'bundle';

    return (
        <div
            className="relative h-full"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <Link
                href={category.href}
                className={`flex items-center gap-2 h-full px-4 transition-all font-medium text-sm hover:text-primary ${isActive ? 'text-primary bg-muted/50' : 'text-muted-foreground'
                    }`}
            >
                <MenuIcon
                    path={category.icon}
                    viewBox={category.viewBox}
                    className="w-4 h-4"
                />
                <span>{category.name}</span>
            </Link>

            {/* Mega Dropdown (not for Bundle - it has no subcategories) */}
            {!isBundle && isActive && category.subCategories.length > 0 && (
                <div
                    className="absolute top-full left-0 w-[900px] bg-background border border-border rounded-b-xl shadow-2xl z-50"
                    style={{
                        left: '50%',
                        transform: 'translateX(-50%)',
                        maxWidth: 'calc(100vw - 40px)'
                    }}
                >
                    <div className="p-6">
                        {/* Subcategories Grid */}
                        <div className="grid grid-cols-4 gap-6 mb-6">
                            {category.subCategories.map((subCat) => (
                                <div key={subCat.name}>
                                    <Link
                                        href={subCat.href}
                                        className="font-semibold text-foreground hover:text-primary mb-3 block"
                                    >
                                        {subCat.name}
                                    </Link>
                                    <ul className="space-y-1.5">
                                        {subCat.items.map((item) => (
                                            <li key={item.name}>
                                                <Link
                                                    href={item.href}
                                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    {item.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        {/* Top Sellers Section */}
                        {category.topSellers.length > 0 && (
                            <div className="border-t pt-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                                    Top Sellers
                                </h4>
                                <div className="flex gap-4">
                                    {category.topSellers.map((product) => (
                                        <Link
                                            key={product.name}
                                            href={product.href}
                                            className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors flex-1"
                                        >
                                            <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                                                {/* Placeholder for product image */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                                                <MenuIcon
                                                    path={category.icon}
                                                    viewBox={category.viewBox}
                                                    className="w-8 h-8 text-primary/60"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-medium text-sm truncate">{product.name}</h5>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {product.originalPrice && (
                                                        <span className="text-xs text-muted-foreground line-through">
                                                            {product.originalPrice}
                                                        </span>
                                                    )}
                                                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                                        {product.price}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer Link */}
                        <div className="border-t mt-4 pt-4">
                            <Link
                                href={category.footerLink.href}
                                className="flex items-center gap-1.5 text-primary font-medium text-sm hover:underline"
                            >
                                <ChevronRight className="h-3.5 w-3.5 font-bold" />
                                {category.footerLink.label}
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Main Mega Menu Component
export function MegaMenu() {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = (categoryId: string) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setActiveCategory(categoryId);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setActiveCategory(null);
        }, 150); // Small delay to allow moving to dropdown
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <nav className="flex items-center h-12">
            {megaMenuCategories.map((category) => (
                <MegaMenuItem
                    key={category.id}
                    category={category}
                    isActive={activeCategory === category.id}
                    onMouseEnter={() => handleMouseEnter(category.id)}
                    onMouseLeave={handleMouseLeave}
                />
            ))}
        </nav>
    );
}

export default MegaMenu;
