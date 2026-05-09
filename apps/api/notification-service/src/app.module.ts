import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { NotificationController } from "./notification.controller";
import { NotificationProcessor } from "./notification.processor";
import { NotificationService } from "./notification.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>("REDIS_HOST") ?? "localhost",
          port: Number(config.get<string>("REDIS_PORT") ?? 6379),
        },
      }),
    }),
    BullModule.registerQueue({
      name: "notifications",
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationProcessor],
})
export class AppModule {}
