import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { SignOptions } from "jsonwebtoken";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaService } from "./prisma.service";

const jwtExpiresIn = (config: ConfigService): SignOptions["expiresIn"] =>
  (config.get<string>("JWT_EXPIRES_IN") ?? "1d") as SignOptions["expiresIn"];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
})
export class AppModule {}
