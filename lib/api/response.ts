import { NextResponse } from "next/server";

export function apiJson<T>(body: T, init?: ResponseInit): NextResponse<T> {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");

  return NextResponse.json(body, { ...init, headers });
}

export function apiError(error: string, status: number, headers?: HeadersInit): NextResponse<{ error: string }> {
  return apiJson({ error }, { status, headers });
}
