import EventDispatcher from "../../@shared/event/event-dispatcher";
import Customer from "../entity/customer";
import Address from "../value-object/address";
import CustomerAddressChangedEvent from "./customer-address-changed.event";
import CustomerCreatedEvent from "./customer-created.event";
import EnviaConsoleLog1Handler from "./handler/envia-console-log-1.handler";
import EnviaConsoleLog2Handler from "./handler/envia-console-log-2.handler";
import EnviaConsoleLogHandler from "./handler/envia-console-log.handler";

describe("Customer domain events tests", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should notify two handlers when a customer is created", () => {
    const eventDispatcher = new EventDispatcher();
    const handler1 = new EnviaConsoleLog1Handler();
    const handler2 = new EnviaConsoleLog2Handler();
    const spyHandler1 = jest.spyOn(handler1, "handle");
    const spyHandler2 = jest.spyOn(handler2, "handle");
    const spyConsoleLog = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});

    eventDispatcher.register("CustomerCreatedEvent", handler1);
    eventDispatcher.register("CustomerCreatedEvent", handler2);

    const customer = new Customer("123", "Customer 1");
    const customerCreatedEvent = new CustomerCreatedEvent({
      id: customer.id,
      name: customer.name,
    });

    eventDispatcher.notify(customerCreatedEvent);

    expect(spyHandler1).toHaveBeenCalledWith(customerCreatedEvent);
    expect(spyHandler2).toHaveBeenCalledWith(customerCreatedEvent);
    expect(spyConsoleLog).toHaveBeenCalledWith(
      "Esse é o primeiro console.log do evento: CustomerCreated"
    );
    expect(spyConsoleLog).toHaveBeenCalledWith(
      "Esse é o segundo console.log do evento: CustomerCreated"
    );
    expect(spyConsoleLog).toHaveBeenCalledTimes(2);
  });

  it("should notify handler when a customer address is changed", () => {
    const eventDispatcher = new EventDispatcher();
    const handler = new EnviaConsoleLogHandler();
    const spyHandler = jest.spyOn(handler, "handle");
    const spyConsoleLog = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});

    eventDispatcher.register("CustomerAddressChangedEvent", handler);

    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 10, "12345-000", "Sao Paulo");
    customer.changeAddress(address);

    const customerAddressChangedEvent = new CustomerAddressChangedEvent({
      id: customer.id,
      name: customer.name,
      address,
    });

    eventDispatcher.notify(customerAddressChangedEvent);

    expect(customerAddressChangedEvent.eventData).toStrictEqual({
      id: "123",
      name: "Customer 1",
      address,
    });
    expect(spyHandler).toHaveBeenCalledWith(customerAddressChangedEvent);
    expect(spyConsoleLog).toHaveBeenCalledWith(
      "Endereço do cliente: 123, Customer 1 alterado para: Street 1, 10, 12345-000 Sao Paulo"
    );
    expect(spyConsoleLog).toHaveBeenCalledTimes(1);
  });
});
