import { NextRequest, NextResponse } from 'next/server';

export interface SecurityContext {
  ip: string;
  fingerprint: string;
  userAgent: string;
}

export async function getSecurityContext(request: NextRequest): Promise<SecurityContext> {
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  
  const fingerprintData = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${ip}:${userAgent}`)
  );
  const fingerprint = Array.from(new Uint8Array(fingerprintData))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);

  return { ip, fingerprint, userAgent };
}

export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  if (!origin && !referer) return true;
  
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean);

  return allowedOrigins.some(allowed => 
    origin?.startsWith(allowed || '') || referer?.startsWith(allowed || '')
  );
}

export async function withSecurityHeaders(response: NextResponse): Promise<NextResponse> {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export function sanitizeError(error: unknown, isDev: boolean): string {
  if (isDev && error instanceof Error) {
    return error.message;
  }
  return 'An error occurred';
}
