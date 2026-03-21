import type { UserRole } from '@/types';

const ACCESS_KEY = 'cm_access';
const REFRESH_KEY = 'cm_refresh';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function setAccessToken(access: string): void {
  localStorage.setItem(ACCESS_KEY, access);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

interface JwtPayload {
  role?: UserRole;
  email?: string;
  user_id?: number;
  exp?: number;
}

export function parseJwt(token: string): JwtPayload {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return {};
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload.exp) return true;
  return payload.exp * 1000 < Date.now();
}
