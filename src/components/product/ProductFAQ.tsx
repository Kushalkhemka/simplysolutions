"use client";

import { FAQJsonLd } from '@/components/seo/JsonLd';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Common FAQs based on product type
const GENERAL_FAQS = [
    {
        question: "Is this a genuine license key?",
        answer: "Yes, all our license keys are 100% genuine and sourced directly from authorized Microsoft distributors. You will receive a lifetime valid key that can be activated online via Microsoft servers."
    },
    {
        question: "How will I receive my product?",
        answer: "Your product key will be delivered instantly to your email address immediately after purchase. You will also receive installation instructions."
    },
    {
        question: "What if the key doesn't work?",
        answer: "In the unlikely event that a key doesn't work, we offer a full replacement or refund. Our support team is available 24/7 to assist with activation issues."
    }
];

const OFFICE_FAQS = [
    {
        question: "Is this a subscription or one-time purchase?",
        answer: "This is a one-time purchase for a lifetime license. There are no monthly or annual fees. You own the software forever."
    },
    {
        question: "Can I transfer this license to another PC?",
        answer: "Retail licenses (like Professional Plus) can typically be transferred to a new PC if you uninstall it from the old one first. OEM licenses are tied to the motherboard."
    }
];

const WINDOWS_FAQS = [
    {
        question: "Can I upgrade from Windows 10?",
        answer: "Yes, this license can be used to activate a fresh installation or an upgrade from Windows 10, provided your hardware meets Windows 11 requirements."
    },
    {
        question: "Is this the Global version?",
        answer: "Yes, our Windows licenses are Global and can be activated in any country and support all languages."
    }
];

interface ProductFAQProps {
    productName: string;
    category?: string;
}

export function ProductFAQ({ productName, category }: ProductFAQProps) {
    // Combine FAQs based on category keyword matching
    const isOffice = productName.toLowerCase().includes('office') || productName.toLowerCase().includes('project') || productName.toLowerCase().includes('visio');
    const isWindows = productName.toLowerCase().includes('windows');

    let relevantFaqs = [...GENERAL_FAQS];
    if (isOffice) relevantFaqs = [...relevantFaqs, ...OFFICE_FAQS];
    if (isWindows) relevantFaqs = [...relevantFaqs, ...WINDOWS_FAQS];

    return (
        <section className="py-12 border-t border-border">
            <FAQJsonLd items={relevantFaqs} />

            <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>

            <div className="space-y-4">
                {relevantFaqs.map((faq, index) => (
                    <FAQItem key={index} question={faq.question} answer={faq.answer} />
                ))}
            </div>
        </section>
    );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-border rounded-lg overflow-hidden bg-card/50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full p-4 text-left font-medium transition-colors hover:bg-muted/50"
                aria-expanded={isOpen}
            >
                <span>{question}</span>
                {isOpen ? <Minus className="h-4 w-4 text-primary shrink-0 ml-4" /> : <Plus className="h-4 w-4 text-muted-foreground shrink-0 ml-4" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="p-4 pt-0 text-muted-foreground text-sm border-t border-border/50 bg-background/50">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
