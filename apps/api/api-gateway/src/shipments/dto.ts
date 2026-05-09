import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type {
  CreateShipmentPayload,
  ShipmentStatus as ShipmentStatusValue,
  UpdateShipmentStatusPayload,
} from "@repo/api-types/shipments";
import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";

export enum ShipmentStatus {
  Pending = "PENDING",
  PickedUp = "PICKED_UP",
  InTransit = "IN_TRANSIT",
  OutForDelivery = "OUT_FOR_DELIVERY",
  Delivered = "DELIVERED",
  Cancelled = "CANCELLED",
}

export class CreateShipmentDto
  implements Omit<CreateShipmentPayload, "createdById">
{
  @ApiProperty({ example: "LHE-WH-001" })
  @IsString()
  @MinLength(2)
  origin!: string;

  @ApiProperty({ example: "KHI-CUST-981" })
  @IsString()
  @MinLength(2)
  destination!: string;

  @ApiProperty({ example: "2 medium cartons, fragile" })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ example: "DRV-1004" })
  @IsOptional()
  @IsString()
  driverId?: string;
}

export class UpdateShipmentStatusDto
  implements Omit<UpdateShipmentStatusPayload, "id">
{
  @ApiProperty({ enum: ShipmentStatus, example: ShipmentStatus.InTransit })
  @IsEnum(ShipmentStatus)
  status!: ShipmentStatusValue;
}
