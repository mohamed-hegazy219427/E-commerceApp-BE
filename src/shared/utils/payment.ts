import Stripe from 'stripe';
import { env } from '@config/env.js';
import type { Result } from './result.js';
import { ok, fail } from './result.js';
import { AppError } from './AppError.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY as string);

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

//   createCheckoutSession                  ─
// Returns Result<Stripe.Checkout.Session> so Stripe errors are handled
// gracefully instead of propagating as unhandled exceptions.
//
export const createCheckoutSession = async (
  options: PaymentSessionOptions,
): Promise<Result<Stripe.Checkout.Session>> => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: options.customerEmail,
      metadata: options.metadata,
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      discounts: options.discounts ?? [],
      line_items: options.lineItems.map((item) => ({
        price_data: {
          currency: 'egp',
          product_data: { name: item.title },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
    });
    return ok(session);
  } catch {
    return fail(new AppError('Failed to create Stripe checkout session', 500));
  }
};

//   createStripeCoupon  ──
export const createStripeCoupon = async (
  isPercentage: boolean,
  amount: number,
): Promise<Result<Stripe.Coupon>> => {
  try {
    const coupon = isPercentage
      ? await stripe.coupons.create({ percent_off: amount, duration: 'once' })
      : await stripe.coupons.create({
          amount_off: amount * 100,
          currency: 'egp',
          duration: 'once',
        });
    return ok(coupon);
  } catch {
    return fail(new AppError('Failed to create Stripe coupon', 500));
  }
};

export const constructWebhookEvent = (body: Buffer, signature: string): Stripe.Event => {
  return stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET as string);
};

export { stripe };
