import type { ClientSession, Types } from 'mongoose';
import { BaseRepository } from '@repository/BaseRepository.js';
import { orderModel } from '@models/order.model.js';
import type { IOrderDocument, OrderStatus } from '@models/order.model.js';

export class OrderRepository extends BaseRepository<IOrderDocument> {
  constructor() {
    super(orderModel);
  }

  findByUserId(userId: string | Types.ObjectId): Promise<IOrderDocument[]> {
    return this.find({ userId });
  }

  createWithSession(
    data: object[],
    session: ClientSession,
  ): Promise<IOrderDocument[]> {
    return orderModel.create(data, { session }) as Promise<IOrderDocument[]>;
  }

  updateStatus(
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    extra?: Partial<IOrderDocument>,
  ): Promise<IOrderDocument | null> {
    return orderModel
      .findOneAndUpdate(
        { _id: orderId, orderStatus: fromStatus },
        { orderStatus: toStatus, ...extra },
        { new: true },
      )
      .exec();
  }

  /** Used by webhook — update from pending to confirmed/canceled. */
  updateStatusByIdAndCurrentStatus(
    orderId: string,
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): Promise<IOrderDocument | null> {
    return orderModel
      .findOneAndUpdate(
        { _id: orderId, orderStatus: currentStatus },
        { orderStatus: newStatus },
        { new: true },
      )
      .exec();
  }

  findByIdWithStatusGuard(
    orderId: string,
    excludeStatuses: OrderStatus[],
  ): Promise<IOrderDocument | null> {
    return orderModel
      .findOneAndUpdate(
        { _id: orderId, orderStatus: { $nin: excludeStatuses } },
        { orderStatus: 'delivered' },
        { new: true },
      )
      .exec();
  }
}

export const orderRepository = new OrderRepository();
