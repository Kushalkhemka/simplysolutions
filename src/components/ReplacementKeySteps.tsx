'use client';

import Image from 'next/image';
import { X, AlertCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ReplacementKeyStepsProps {
    replacementKey: string;
    onClose: () => void;
}

export default function ReplacementKeySteps({ replacementKey, onClose }: ReplacementKeyStepsProps) {
    const copyKey = () => {
        navigator.clipboard.writeText(replacementKey);
        toast.success('Replacement key copied to clipboard!');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-b from-[#067D62] to-[#055547] text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold">🔑 Replacement Key Generated!</h2>
                        <p className="text-sm text-emerald-100 mt-1">Follow these steps to activate with your new key</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Replacement Key Display */}
                <div className="p-6 bg-[#FFF4E5] border-b-2 border-[#FF9900]">
                    <p className="text-sm font-bold text-[#0F1111] mb-2 uppercase tracking-wide">Your New Replacement Key:</p>
                    <div className="flex items-center gap-3 p-4 bg-white border-2 border-[#FF9900] rounded-lg">
                        <code className="flex-1 font-mono text-lg font-bold text-[#0F1111] break-all">
                            {replacementKey}
                        </code>
                        <button
                            onClick={copyKey}
                            className="p-2.5 hover:bg-[#FF9900]/10 rounded-lg transition-colors flex-shrink-0"
                            title="Copy to clipboard"
                        >
                            <Copy className="w-5 h-5 text-[#FF9900]" />
                        </button>
                    </div>
                    <button
                        onClick={copyKey}
                        className="mt-3 w-full py-2.5 bg-gradient-to-b from-[#FFD814] to-[#F7CA00] hover:from-[#F7CA00] hover:to-[#E7B800] text-[#0F1111] font-bold rounded-lg border border-[#FCD200] shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                        <Copy className="w-4 h-4" />
                        Copy Key to Clipboard
                    </button>
                </div>

                {/* Instructions */}
                <div className="p-6 space-y-5">
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-amber-900 mb-1">Important Note</p>
                                <p className="text-sm text-amber-800">
                                    Your previous Installation ID was blocked. This new key will give you a fresh start.
                                    Please follow the steps below carefully.
                                </p>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-[#0F1111]">Steps to Apply Replacement Key:</h3>

                    <div className="space-y-4">
                        {/* Step 1 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-[#232F3E] text-white rounded-full flex items-center justify-center font-bold text-sm">
                                1
                            </div>
                            <div className="flex-1">
                                <p className="text-[#0F1111]">Open any Microsoft App (e.g. <strong>Excel</strong> / <strong>Word</strong> / <strong>Access</strong>)</p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-[#232F3E] text-white rounded-full flex items-center justify-center font-bold text-sm">
                                2
                            </div>
                            <div className="flex-1">
                                <p className="text-[#0F1111]">Click on the <strong>File Menu</strong></p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-[#232F3E] text-white rounded-full flex items-center justify-center font-bold text-sm">
                                3
                            </div>
                            <div className="flex-1">
                                <p className="text-[#0F1111] mb-3">Click on <strong>Accounts</strong> option from the bottom left corner</p>
                                <div className="rounded-lg border border-[#DDD] overflow-hidden bg-white shadow-sm">
                                    <Image
                                        src="/officenewassests/step4_1.png"
                                        alt="Accounts menu location"
                                        width={600}
                                        height={400}
                                        className="w-full h-auto"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-[#232F3E] text-white rounded-full flex items-center justify-center font-bold text-sm">
                                4
                            </div>
                            <div className="flex-1">
                                <p className="text-[#0F1111]">Check on the right side you will get the option to <strong>&quot;Change License Key&quot;</strong></p>
                            </div>
                        </div>

                        {/* Step 5 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-[#FF9900] text-white rounded-full flex items-center justify-center font-bold text-sm">
                                5
                            </div>
                            <div className="flex-1">
                                <p className="text-[#0F1111] mb-3">Click on it and apply the replacement key</p>
                                <div className="p-3 bg-[#FCF5EE] border border-[#FF9900] rounded-lg">
                                    <code className="font-mono text-sm font-bold text-[#0F1111] break-all">
                                        {replacementKey}
                                    </code>
                                </div>
                                <div className="rounded-lg border border-[#DDD] overflow-hidden bg-white shadow-sm mt-3">
                                    <Image
                                        src="/officenewassests/step4_5.png"
                                        alt="Change license key dialog"
                                        width={600}
                                        height={400}
                                        className="w-full h-auto"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Step 6 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-[#232F3E] text-white rounded-full flex items-center justify-center font-bold text-sm">
                                6
                            </div>
                            <div className="flex-1">
                                <p className="text-[#0F1111]">Click on <strong>&quot;I want to activate by telephone&quot;</strong> → You will get a <span className="text-[#067D62] font-bold">different Installation ID</span> this time</p>
                            </div>
                        </div>

                        {/* Step 7 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-[#232F3E] text-white rounded-full flex items-center justify-center font-bold text-sm">
                                7
                            </div>
                            <div className="flex-1">
                                <p className="text-[#0F1111]">
                                    Visit{' '}
                                    <a
                                        href="https://simplysolutions.co.in/getcid"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#007185] hover:text-[#C7511F] hover:underline font-bold"
                                    >
                                        simplysolutions.co.in/getcid
                                    </a>
                                    {' '}and enter your <strong>installation ID</strong> and <strong>order ID</strong>
                                </p>
                            </div>
                        </div>

                        {/* Step 8 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-[#067D62] text-white rounded-full flex items-center justify-center font-bold text-sm">
                                8
                            </div>
                            <div className="flex-1">
                                <p className="text-[#0F1111]">Enter the generated <strong>Confirmation ID</strong> back in the application and it&apos;s all done! ✅</p>
                            </div>
                        </div>
                    </div>

                    {/* Apology */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                        <p className="text-sm text-blue-900">
                            <span className="font-bold">We apologize for the inconvenience.</span> If you continue to face issues, please contact our support team.
                        </p>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-[#232F3E] hover:bg-[#37475A] text-white font-bold rounded-lg transition-colors"
                    >
                        Close Instructions
                    </button>
                </div>
            </div>
        </div>
    );
}
