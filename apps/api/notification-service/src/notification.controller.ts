import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import type { ShipmentEventPayload } from "@repo/api-types/events";
import { NotificationService } from "./notification.service";

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern("shipment.created")
  shipmentCreated(@Payload() payload: ShipmentEventPayload) {
    return this.notificationService.enqueueShipmentCreated(payload);
  }

  @EventPattern("shipment.status.changed")
  shipmentStatusChanged(@Payload() payload: ShipmentEventPayload) {
    return this.notificationService.enqueueShipmentStatusChanged(payload);
  }
}
