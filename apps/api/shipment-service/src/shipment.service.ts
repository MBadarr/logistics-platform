import {
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import type {
  CreateShipmentPayload,
  UpdateShipmentStatusPayload,
} from "@repo/api-types/shipments";
import { PrismaService } from "./prisma.service";
import { ShipmentStatus } from "./generated/prisma";

@Injectable()
export class ShipmentService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    @Inject("EVENT_CLIENT") private readonly eventClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.eventClient.connect();
  }

  async create(payload: CreateShipmentPayload) {
    const trackingNo = `SHP-${Date.now()}`;
    const shipment = await this.prisma.shipment.create({
      data: {
        trackingNo,
        origin: payload.origin,
        destination: payload.destination,
        description: payload.description,
        driverId: payload.driverId,
        createdById: payload.createdById,
        timeline: {
          create: {
            status: ShipmentStatus.PENDING,
            note: "Shipment created",
          },
        },
      },
      include: { timeline: true },
    });

    this.eventClient.emit("shipment.created", shipment);
    return shipment;
  }

  list() {
    return this.prisma.shipment.findMany({
      orderBy: { createdAt: "desc" },
      include: { timeline: true },
    });
  }

  async get(id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: { timeline: { orderBy: { createdAt: "asc" } } },
    });

    if (!shipment) {
      throw new NotFoundException("Shipment not found.");
    }

    return shipment;
  }

  async updateStatus(payload: UpdateShipmentStatusPayload) {
    await this.get(payload.id);

    const shipment = await this.prisma.shipment.update({
      where: { id: payload.id },
      data: {
        status: payload.status,
        timeline: {
          create: {
            status: payload.status,
            note: `Status changed to ${payload.status}`,
          },
        },
      },
      include: { timeline: true },
    });

    this.eventClient.emit("shipment.status.changed", shipment);
    return shipment;
  }
}
