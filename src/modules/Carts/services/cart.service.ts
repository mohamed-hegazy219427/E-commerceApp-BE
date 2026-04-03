import { Types } from 'mongoose';
import { ok, fail } from '@utils/result.js';
import { AppError } from '@utils/AppError.js';
import type { Result } from '@utils/result.js';
import type { ICartDocument } from '@models/cart.model.js';
import { productRepository } from '../../Products/repositories/product.repository.js';
import { cartRepository } from '../repositories/cart.repository.js';

class CartService {
  async addToCart(
    userId: Types.ObjectId,
    productId: string,
    quantity: number,
  ): Promise<Result<ICartDocument>> {
    const product = await productRepository.findById(productId);
    if (!product) return fail(new AppError('Product not found', 404));
    if (product.stock < quantity) return fail(new AppError('Requested quantity exceeds stock', 400));

    let cart = await cartRepository.findByUserId(userId);

    if (cart) {
      const existingItem = cart.products.find((p) => p.productId.toString() === productId);
      if (existingItem) {
        existingItem.quantity = quantity;
      } else {
        cart.products.push({ productId: new Types.ObjectId(productId), quantity });
      }

      let subTotal = 0;
      for (const item of cart.products) {
        const p = await productRepository.findById(String(item.productId));
        if (p) subTotal += p.priceAfterDiscount * item.quantity;
      }
      cart.subTotal = subTotal;
      await cart.save();
    } else {
      cart = await cartRepository.create({
        userId,
        products: [{ productId, quantity }],
        subTotal: product.priceAfterDiscount * quantity,
      });
    }

    return ok(cart);
  }

  async deleteFromCart(
    userId: Types.ObjectId,
    productId: string,
  ): Promise<Result<ICartDocument>> {
    const product = await productRepository.findById(productId);
    if (!product) return fail(new AppError('Product not found', 404));

    const cart = await cartRepository.findByUserAndProduct(userId, productId);
    if (!cart) return fail(new AppError('Product not in cart', 404));

    const item = cart.products.find((p) => p.productId.toString() === productId);
    if (item) {
      cart.subTotal -= product.priceAfterDiscount * item.quantity;
      cart.products = cart.products.filter((p) => p.productId.toString() !== productId);
    }

    await cart.save();
    return ok(cart);
  }

  async clearCart(userId: Types.ObjectId): Promise<Result<ICartDocument>> {
    const cart = await cartRepository.findByUserId(userId);
    if (!cart) return fail(new AppError('Cart not found', 404));

    cart.products = [];
    cart.subTotal = 0;
    await cart.save();
    return ok(cart);
  }
}

export const cartService = new CartService();
