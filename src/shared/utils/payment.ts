import Stripe from 'stripe';
import { env } from '@config/env.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export interface LineItem {
  title: string;
  price: number;
  quantity: number;
}

interface PaymentSessionOptions {
  customerEmail: string;
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
  lineItems: LineItem[];
  discounts?: { coupon: string }[];
}

export const createCheckoutSession = async ({
  customerEmail,
  metadata,
  successUrl,
  cancelUrl,
  lineItems,
  discounts = [],
}: PaymentSessionOptions): Promise<Stripe.Checkout.Session> => {
  return stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: customerEmail,
    metadata,
    success_url: successUrl,
    cancel_url: cancelUrl,
    discounts,
    line_items: lineItems.map((item) => ({
      price_data: {
        currency: 'egp',
        product_data: { name: item.title },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),
  });
};

export const createStripeCoupon = async (
  isPercentage: boolean,
  amount: number,
): Promise<Stripe.Coupon> => {
  if (isPercentage) {
    return stripe.coupons.create({ percent_off: amount, duration: 'once' });
  }
  return stripe.coupons.create({ amount_off: amount * 100, currency: 'egp', duration: 'once' });
};

export const constructWebhookEvent = (
  body: Buffer,
  signature: string,
): Stripe.Event => {
  return stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
};

export { stripe };
