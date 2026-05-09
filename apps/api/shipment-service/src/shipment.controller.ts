import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import type {
  CreateShipmentPayload,
  ShipmentByIdPayload,
  UpdateShipmentStatusPayload,
} from "@repo/api-types/shipments";
import { ShipmentService } from "./shipment.service";

@Controller()
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @MessagePattern("shipment.create")
  create(@Payload() payload: CreateShipmentPayload) {
    return this.shipmentService.create(payload);
  }

  @MessagePattern("shipment.list")
  list() {
    return this.shipmentService.list();
  }

  @MessagePattern("shipment.get")
  get(@Payload() payload: ShipmentByIdPayload) {
    return this.shipmentService.get(payload.id);
  }

  @MessagePattern("shipment.updateStatus")
  updateStatus(@Payload() payload: UpdateShipmentStatusPayload) {
    return this.shipmentService.updateStatus(payload);
  }
}
