import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";

async function bootstrap() {
  const context = await NestFactory.createApplicationContext(AppModule);
  const config = context.get(ConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: "notification-service",
          brokers: (
            config.get<string>("KAFKA_BROKERS") ?? "localhost:9092"
          ).split(","),
        },
        consumer: {
          groupId: "notification-service-consumer",
        },
      },
    },
  );

  await context.close();
  await app.listen();
}

void bootstrap();
