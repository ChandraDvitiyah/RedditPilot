export function getDodoProductId(): string {
  // Prefer explicit DEV/PROD split if provided; else use single product id for both
  const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost');
  const prodId = (import.meta as any).env?.VITE_DODO_PRODUCT_ID || '';
  const devId = (import.meta as any).env?.VITE_DODO_PRODUCT_ID_DEV || prodId;
  if (!prodId && !devId) {
    console.warn('Dodo Payments: No VITE_DODO_PRODUCT_ID configured');
  }
  return isDev ? (devId || prodId) : (prodId || devId);
}

export function buildDodoPaymentLink(options: {
  productId?: string;
  quantity?: number;
  redirectUrl: string;
  userEmail?: string | null;
  userId?: string | null;
  fullName?: string | null;
}): string {
  const productId = options.productId || getDodoProductId();
  const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development' || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.local')));
  const host = isDev ? 'test.checkout.dodopayments.com' : 'checkout.dodopayments.com';
  const base = `https://${host}/buy/${productId}`;
  const params = new URLSearchParams();
  params.set('quantity', String(options.quantity ?? 1));
  params.set('redirect_url', options.redirectUrl);
  // Prefill email/name if available
  if (options.userEmail) {
    params.set('email', options.userEmail);
    params.set('disableEmail', 'true');
  }
  if (options.fullName) {
    params.set('fullName', options.fullName);
    params.set('disableFullName', 'true');
  }
  // Show discounts/coupon field so users can enter PRIVATE20
  params.set('showDiscounts', 'true');
  // Attach metadata for reconciliation
  if (options.userId) {
    params.set('metadata_userId', options.userId);
  }
  return `${base}?${params.toString()}`;
}
