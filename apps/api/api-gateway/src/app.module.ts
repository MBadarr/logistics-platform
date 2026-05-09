import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import {
  ClientProvider,
  ClientsModule,
  Transport,
} from "@nestjs/microservices";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { SignOptions } from "jsonwebtoken";
import { AuthController } from "./auth/auth.controller";
import { JwtStrategy } from "./auth/jwt.strategy";
import { ShipmentsController } from "./shipments/shipments.controller";

const jwtExpiresIn = (config: ConfigService): SignOptions["expiresIn"] =>
  (config.get<string>("JWT_EXPIRES_IN") ?? "1d") as SignOptions["expiresIn"];

const kafkaClient = (
  clientId: string,
  groupId: string,
  config: ConfigService,
): ClientProvider => ({
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId,
      brokers: (config.get<string>("KAFKA_BROKERS") ?? "localhost:9092").split(
        ",",
      ),
    },
    consumer: {
      groupId,
    },
  },
});

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>("JWT_SECRET") ?? "dev-super-secret-change-me",
        signOptions: {
          expiresIn: jwtExpiresIn(config),
        },
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: "AUTH_CLIENT",
        inject: [ConfigService],
        useFactory: (config: ConfigService) =>
          kafkaClient("api-gateway-auth", "api-gateway-auth-consumer", config),
      },
      {
        name: "SHIPMENT_CLIENT",
        inject: [ConfigService],
        useFactory: (config: ConfigService) =>
          kafkaClient(
            "api-gateway-shipments",
            "api-gateway-shipments-consumer",
            config,
          ),
      },
    ]),
  ],
  controllers: [AuthController, ShipmentsController],
  providers: [JwtStrategy],
})
export class AppModule {}
