import Link from 'next/link';
import { CheckCircle, Package, ArrowRight, Mail, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutSuccessPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-lg mx-auto text-center">
                {/* Success Icon */}
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                </div>

                <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
                <p className="text-muted-foreground mb-8">
                    Thank you for your purchase. Your license keys are on their way!
                </p>

                {/* Order Details */}
                <div className="bg-muted/50 rounded-lg p-6 mb-8 text-left space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-medium">Check your email</h3>
                            <p className="text-sm text-muted-foreground">
                                We've sent your order confirmation and license keys to your email address.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-medium">Access your licenses</h3>
                            <p className="text-sm text-muted-foreground">
                                You can also view and copy your license keys from your dashboard anytime.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Download className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-medium">Download your software</h3>
                            <p className="text-sm text-muted-foreground">
                                Use the official links provided in the email to download your software.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/dashboard/orders">
                        <Button className="gap-2 w-full sm:w-auto">
                            View My Orders
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href="/products">
                        <Button variant="outline" className="w-full sm:w-auto">
                            Continue Shopping
                        </Button>
                    </Link>
                </div>

                <p className="text-sm text-muted-foreground mt-8">
                    Need help? Contact us at{' '}
                    <a href="mailto:support@simplysolutions.com" className="text-primary hover:underline">
                        support@simplysolutions.com
                    </a>
                </p>
            </div>
        </div>
    );
}
