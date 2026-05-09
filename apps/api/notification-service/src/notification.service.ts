import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import type { ShipmentEventPayload } from "@repo/api-types/events";
import { Queue } from "bullmq";

@Injectable()
export class NotificationService {
  constructor(
    @InjectQueue("notifications") private readonly notificationQueue: Queue,
  ) {}

  enqueueShipmentCreated(payload: ShipmentEventPayload) {
    return this.notificationQueue.add("shipment.created", payload, {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    });
  }

  enqueueShipmentStatusChanged(payload: ShipmentEventPayload) {
    return this.notificationQueue.add("shipment.status.changed", payload, {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    });
  }
}
