import { NextResponse } from 'next/server';
import type { ApiResponse, PaginatedResponse } from '@/types';

// Standard success response
export function successResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
        success: true,
        data,
        message,
    });
}

// Standard error response
export function errorResponse(
    error: string,
    status: number = 400
): NextResponse<ApiResponse<never>> {
    return NextResponse.json(
        {
            success: false,
            error,
        },
        { status }
    );
}

// Paginated response
export function paginatedResponse<T>(
    data: T[],
    pagination: { page: number; limit: number; total: number }
): NextResponse<PaginatedResponse<T>> {
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    return NextResponse.json({
        success: true,
        data,
        pagination: {
            ...pagination,
            totalPages,
        },
    });
}

// Error handler wrapper for API routes
export function withErrorHandler<T>(
    handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiResponse<never>>> {
    return handler().catch((error) => {
        console.error('API Error:', error);

        if (error instanceof Error) {
            return errorResponse(error.message, 500);
        }

        return errorResponse('An unexpected error occurred', 500);
    });
}

// Parse pagination params from URL
export function getPaginationParams(searchParams: URLSearchParams): {
    page: number;
    limit: number;
    offset: number;
} {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
}

// Not found response
export function notFoundResponse(resource: string = 'Resource'): NextResponse<ApiResponse<never>> {
    return errorResponse(`${resource} not found`, 404);
}

// Unauthorized response
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse<ApiResponse<never>> {
    return errorResponse(message, 401);
}

// Forbidden response
export function forbiddenResponse(message: string = 'Forbidden'): NextResponse<ApiResponse<never>> {
    return errorResponse(message, 403);
}

// Validation error response
export function validationErrorResponse(errors: Record<string, string[]>): NextResponse<ApiResponse<never>> {
    return NextResponse.json(
        {
            success: false,
            error: 'Validation failed',
            errors,
        },
        { status: 422 }
    );
}
