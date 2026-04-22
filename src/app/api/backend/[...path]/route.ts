import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function backendOrigin(): string {
  return (
    process.env.BACKEND_PROXY_TARGET ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://premium-reklam-backend.onrender.com"
  ).replace(/\/+$/, "");
}

async function forward(req: NextRequest, pathSegments: string[]) {
  const sub = pathSegments.length ? pathSegments.join("/") : "";
  const target = `${backendOrigin()}/api/${sub}${req.nextUrl.search}`;

  const headers = new Headers();
  headers.set("Accept", req.headers.get("accept") || "application/json");
  const ct = req.headers.get("content-type");
  if (ct) headers.set("Content-Type", ct);
  const auth = req.headers.get("authorization");
  if (auth) headers.set("Authorization", auth);
  headers.set("User-Agent", "Premium-Reklam-Next-Proxy/1.0");

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
  };

  if (!["GET", "HEAD"].includes(req.method)) {
    const buf = await req.arrayBuffer();
    if (buf.byteLength) init.body = buf;
  }

  const res = await fetch(target, init);
  const body = await res.arrayBuffer();
  const out = new NextResponse(body, { status: res.status });
  const outCt = res.headers.get("content-type");
  if (outCt) out.headers.set("Content-Type", outCt);
  const allow = res.headers.get("access-control-allow-origin");
  if (allow) out.headers.set("Access-Control-Allow-Origin", allow);
  return out;
}

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return forward(req, path);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return forward(req, path);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return forward(req, path);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return forward(req, path);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return forward(req, path);
}

export async function OPTIONS(req: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return forward(req, path);
}
