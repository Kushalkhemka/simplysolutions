'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, ExternalLink, AlertTriangle, CheckCircle, BookOpen } from 'lucide-react';

interface InstallationGuideProps {
    guideFile: string;
    productName?: string;
    downloadLink?: string;
}

export default function InstallationGuide({ guideFile, productName, downloadLink }: InstallationGuideProps) {
    const [content, setContent] = useState<string>('');
    const [isExpanded, setIsExpanded] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadGuide() {
            try {
                const response = await fetch(`/installation-guides/${guideFile}`);
                if (!response.ok) {
                    throw new Error('Guide not found');
                }
                const text = await response.text();
                setContent(text);
            } catch (err) {
                console.error('Failed to load guide:', err);
                setError('Installation guide not available');
            } finally {
                setIsLoading(false);
            }
        }

        if (guideFile) {
            loadGuide();
        } else {
            setIsLoading(false);
            setError('No installation guide specified');
        }
    }, [guideFile]);

    // Parse markdown to React elements
    const renderMarkdown = (md: string) => {
        const lines = md.split('\n');
        const elements: JSX.Element[] = [];
        let key = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Skip empty lines
            if (!line.trim()) {
                elements.push(<div key={key++} className="h-2" />);
                continue;
            }

            // Headers
            if (line.startsWith('## ')) {
                elements.push(
                    <h2 key={key++} className="text-lg font-bold text-[#0F1111] mt-4 mb-2">
                        {line.slice(3)}
                    </h2>
                );
                continue;
            }

            // Horizontal rule
            if (line === '---') {
                elements.push(<hr key={key++} className="my-4 border-[#DDD]" />);
                continue;
            }

            // Warning blocks
            if (line.startsWith('> ⚠️')) {
                elements.push(
                    <div key={key++} className="flex items-start gap-2 bg-[#FEF8F2] border-l-4 border-[#FF9900] p-3 my-2 rounded-r">
                        <AlertTriangle className="w-5 h-5 text-[#FF9900] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-[#0F1111]">{line.slice(5)}</span>
                    </div>
                );
                continue;
            }

            // Images
            const imgMatch = line.match(/!\[.*?\]\((.*?)\)/);
            if (imgMatch) {
                const imgUrl = imgMatch[1];
                elements.push(
                    <div key={key++} className="my-4 flex justify-center">
                        <div className="relative max-w-md w-full rounded-lg overflow-hidden border border-[#DDD] shadow-sm">
                            <Image
                                src={imgUrl}
                                alt="Installation step"
                                width={400}
                                height={300}
                                className="w-full h-auto object-contain"
                                unoptimized
                            />
                        </div>
                    </div>
                );
                continue;
            }

            // Links
            let processedLine = line;
            const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
            const parts: (string | JSX.Element)[] = [];
            let lastIndex = 0;
            let match;

            while ((match = linkRegex.exec(line)) !== null) {
                if (match.index > lastIndex) {
                    parts.push(line.slice(lastIndex, match.index));
                }
                parts.push(
                    <a
                        key={`link-${key}-${match.index}`}
                        href={match[2]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#007185] hover:text-[#C7511F] hover:underline inline-flex items-center gap-1"
                    >
                        {match[1]}
                        <ExternalLink className="w-3 h-3" />
                    </a>
                );
                lastIndex = match.index + match[0].length;
            }

            if (parts.length > 0) {
                if (lastIndex < line.length) {
                    parts.push(line.slice(lastIndex));
                }
                elements.push(
                    <p key={key++} className="text-sm text-[#0F1111] my-1 leading-relaxed">
                        {parts}
                    </p>
                );
                continue;
            }

            // Bold text
            processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            // Regular paragraph
            elements.push(
                <p
                    key={key++}
                    className="text-sm text-[#0F1111] my-1 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: processedLine }}
                />
            );
        }

        return elements;
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg border border-[#DDD] p-4">
                <div className="flex items-center gap-2 text-[#565959]">
                    <div className="w-4 h-4 border-2 border-[#FF9900]/30 border-t-[#FF9900] rounded-full animate-spin" />
                    <span className="text-sm">Loading installation guide...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#FCF4F4] rounded-lg border border-[#CC0C39] p-4">
                <div className="flex items-center gap-2 text-[#CC0C39]">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-[#DDD] overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full bg-gradient-to-b from-[#F7F8FA] to-[#E7E9EC] px-4 py-3 border-b border-[#DDD] flex items-center justify-between hover:from-[#E7E9EC] hover:to-[#D5D9D9] transition-colors"
            >
                <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#FF9900]" />
                    <span className="font-bold text-[#0F1111] text-sm">
                        Installation Guide {productName ? `- ${productName}` : ''}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-[#565959]">
                        {isExpanded ? 'Click to collapse' : 'Click to expand'}
                    </span>
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[#565959]" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-[#565959]" />
                    )}
                </div>
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="p-4 max-h-[600px] overflow-y-auto">
                    {/* Download button if available */}
                    {downloadLink && (
                        <a
                            href={downloadLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mb-4 w-full py-3 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] text-[#0F1111] font-bold rounded-lg border border-[#FCD200] shadow-sm flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="w-5 h-5" />
                            Download Installer
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    )}

                    {/* Rendered markdown content */}
                    <div className="prose prose-sm max-w-none">
                        {renderMarkdown(content)}
                    </div>
                </div>
            )}
        </div>
    );
}
