import { NextResponse } from "next/server";
import getMyToken from "@/utilities/getMyToken";
import { apiUrl } from '@/lib/api';

export async function GET() {
  const token = await getMyToken();
  if (!token) {
    return NextResponse.json({ status: "unauthenticated", count: 0 });
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(apiUrl('/cart'), {
      headers: { token, "Content-Type": "application/json" },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      return NextResponse.json({ status: "fail", count: 0 });
    }
    const data = await res.json();
    if (data?.status === "success" && Array.isArray(data?.data?.products)) {
      const sum = data.data.products.reduce((acc: number, item: { count?: number }) => acc + (item.count || 0), 0);
      return NextResponse.json({ status: "success", count: sum });
    }
    return NextResponse.json({ status: "fail", count: 0 });
  } catch {
    return NextResponse.json({ status: "error", count: 0 });
  }
}
