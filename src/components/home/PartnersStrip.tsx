"use client";

// Simple grayscale partners strip
export function PartnersStrip() {
    const partners = [
        "Kaspersky", "Amazon", "Avast", "ESET", "Parallels", "Nuance"
    ];

    return (
        <section className="container-dense mb-12">
            <div className="py-8 border-y flex items-center justify-center flex-wrap gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                {partners.map((partner) => (
                    <span key={partner} className="text-2xl font-black text-muted-foreground uppercase tracking-widest cursor-default select-none">
                        {partner}
                    </span>
                ))}
            </div>
        </section>
    );
}
