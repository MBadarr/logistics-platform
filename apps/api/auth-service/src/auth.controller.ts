import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import type { LoginPayload, RegisterPayload } from "@repo/api-types/auth";
import { AuthService } from "./auth.service";

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern("auth.register")
  register(@Payload() payload: RegisterPayload) {
    return this.authService.register(payload);
  }

  @MessagePattern("auth.login")
  login(@Payload() payload: LoginPayload) {
    return this.authService.login(payload);
  }
}
