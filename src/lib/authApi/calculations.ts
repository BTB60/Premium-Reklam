import { OrderItem } from "./types";

export function calculateLineTotal(item: { unitPrice?: number; width?: number; height?: number; quantity?: number }): number {
  const price = Number(item.unitPrice) || 0;
  const qty = Number(item.quantity) || 1;
  const width = Number(item.width) || 0;
  const height = Number(item.height) || 0;
  
  const hasDimensions = width > 0 && height > 0;
  return hasDimensions ? price * width * height * qty : price * qty;
}

export function calculateOrderTotals(items: any[], discountPercent: number = 0) {
  const subtotal = items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  const discountAmount = (subtotal * (discountPercent || 0)) / 100;
  const totalAmount = subtotal - discountAmount;
  return { subtotal, discountAmount, totalAmount };
}