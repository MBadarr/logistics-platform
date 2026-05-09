import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import {
  ClientProvider,
  ClientsModule,
  Transport,
} from "@nestjs/microservices";
import { PrismaService } from "./prisma.service";
import { ShipmentController } from "./shipment.controller";
import { ShipmentService } from "./shipment.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.registerAsync([
      {
        name: "EVENT_CLIENT",
        inject: [ConfigService],
        useFactory: (config: ConfigService): ClientProvider => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: "shipment-events",
              brokers: (
                config.get<string>("KAFKA_BROKERS") ?? "localhost:9092"
              ).split(","),
            },
            consumer: {
              groupId: "shipment-events-consumer",
            },
          },
        }),
      },
    ]),
  ],
  controllers: [ShipmentController],
  providers: [PrismaService, ShipmentService],
})
export class AppModule {}
