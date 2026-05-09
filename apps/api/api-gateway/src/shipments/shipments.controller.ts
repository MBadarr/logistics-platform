import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { firstValueFrom, timeout } from "rxjs";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateShipmentDto, UpdateShipmentStatusDto } from "./dto";

type AuthenticatedRequest = Request & {
  user: {
    sub: string;
  };
};

@ApiTags("shipments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("shipments")
export class ShipmentsController implements OnModuleInit {
  constructor(
    @Inject("SHIPMENT_CLIENT") private readonly shipmentClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.shipmentClient.subscribeToResponseOf("shipment.create");
    this.shipmentClient.subscribeToResponseOf("shipment.list");
    this.shipmentClient.subscribeToResponseOf("shipment.get");
    this.shipmentClient.subscribeToResponseOf("shipment.updateStatus");
    await this.shipmentClient.connect();
  }

  @Post()
  create(@Body() dto: CreateShipmentDto, @Req() request: AuthenticatedRequest) {
    return firstValueFrom(
      this.shipmentClient
        .send("shipment.create", { ...dto, createdById: request.user.sub })
        .pipe(timeout(5000)),
    );
  }

  @Get()
  list() {
    return firstValueFrom(
      this.shipmentClient.send("shipment.list", {}).pipe(timeout(5000)),
    );
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return firstValueFrom(
      this.shipmentClient.send("shipment.get", { id }).pipe(timeout(5000)),
    );
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateShipmentStatusDto) {
    return firstValueFrom(
      this.shipmentClient
        .send("shipment.updateStatus", { id, status: dto.status })
        .pipe(timeout(5000)),
    );
  }
}
