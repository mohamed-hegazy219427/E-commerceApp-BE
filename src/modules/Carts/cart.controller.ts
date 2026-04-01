import type { Request, Response, NextFunction } from 'express';
import { productModel } from '@models/product.model.js';
import { cartModel } from '@models/cart.model.js';
import { asyncHandler } from '@utils/asyncHandler.js';
import { sendSuccess } from '@utils/response.js';
import { AppError } from '@utils/AppError.js';

export const addToCart = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.authUser!._id;
  const { productId, quantity } = req.body as { productId: string; quantity: number };

  const product = await productModel.findById(productId);
  if (!product) return next(new AppError(req.t.cart.invalidProductId, 404));
  if (product.stock < quantity) return next(new AppError(req.t.cart.stockExceeded, 400));

  let cart = await cartModel.findOne({ userId });

  if (cart) {
    const existingItem = cart.products.find((p) => p.productId.toString() === productId);
    if (existingItem) {
      existingItem.quantity = quantity;
    } else {
      cart.products.push({ productId: productId as unknown as typeof cart.products[0]['productId'], quantity });
    }

    // Recalculate subTotal
    let subTotal = 0;
    for (const item of cart.products) {
      const p = await productModel.findById(item.productId);
      if (p) subTotal += p.priceAfterDiscount * item.quantity;
    }
    cart.subTotal = subTotal;
    await cart.save();
  } else {
    cart = await cartModel.create({
      userId,
      products: [{ productId, quantity }],
      subTotal: product.priceAfterDiscount * quantity,
    });
  }

  return sendSuccess(res, { cart });
});

export const deleteFromCart = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.authUser!._id;
  const { productId } = req.body as { productId: string };

  const product = await productModel.findById(productId);
  if (!product) return next(new AppError(req.t.cart.invalidProductId, 404));

  const cart = await cartModel.findOne({ userId, 'products.productId': productId });
  if (!cart) return next(new AppError(req.t.cart.productNotInCart, 404));

  const item = cart.products.find((p) => p.productId.toString() === productId);
  if (item) {
    cart.subTotal -= product.priceAfterDiscount * item.quantity;
    cart.products = cart.products.filter((p) => p.productId.toString() !== productId);
  }

  await cart.save();
  return sendSuccess(res, { cart });
});

export const clearCart = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.authUser!._id;
  const cart = await cartModel.findOne({ userId });
  if (!cart) return next(new AppError(req.t.cart.notFound, 404));

  cart.products = [];
  cart.subTotal = 0;
  await cart.save();
  return sendSuccess(res, { cart });
});
