import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    await OrderModel.sequelize.transaction(async (transaction) => {
      await OrderModel.update(
        {
          customer_id: entity.customerId,
          total: entity.total(),
        },
        {
          where: { id: entity.id },
          transaction,
        }
      );

      await OrderItemModel.destroy({
        where: { order_id: entity.id },
        transaction,
      });

      await OrderItemModel.bulkCreate(
        entity.items.map((item) => ({
          id: item.id,
          order_id: entity.id,
          product_id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        { transaction }
      );
    });
  }

  async find(id: string): Promise<Order> {
    const orderModel = await OrderModel.findOne({
      where: { id },
      include: [OrderItemModel],
    });

    if (!orderModel) {
      throw new Error("Order not found");
    }

    return this.toDomain(orderModel);
  }

  async findAll(): Promise<Order[]> {
    const orderModels = await OrderModel.findAll({
      include: [OrderItemModel],
    });

    return orderModels.map((orderModel) => this.toDomain(orderModel));
  }

  private toDomain(orderModel: OrderModel): Order {
    const items = orderModel.items.map(
      (item) =>
        new OrderItem(
          item.id,
          item.name,
          item.price,
          item.product_id,
          item.quantity
        )
    );
    return new Order(orderModel.id, orderModel.customer_id, items);
  }
}
