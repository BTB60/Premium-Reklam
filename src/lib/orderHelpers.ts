// Helper functions for order data

export const getOrderTotal = (order: any): number => {
  return Number(
    order?.totalAmount ??
    order?.total_amount ??
    order?.finalTotal ??
    order?.subtotal ??
    0
  );
};

export const getOrderPaid = (order: any): number => {
  return Number(
    order?.paidAmount ??
    order?.paid_amount ??
    order?.paid ?? 
    0
  );
};

export const getOrderRemaining = (order: any): number => {
  return Number(
    order?.remainingAmount ??
    order?.remaining_amount ??
    order?.remaining ??
    getOrderTotal(order) - getOrderPaid(order)
  );
};

export const formatAZN = (amount: number | undefined | null): string => {
  return `${Number(amount ?? 0).toFixed(2)} AZN`;
};
