import { Body, Controller, Inject, OnModuleInit, Post } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { ApiTags } from "@nestjs/swagger";
import { firstValueFrom, timeout } from "rxjs";
import { LoginDto, RegisterDto } from "./dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController implements OnModuleInit {
  constructor(
    @Inject("AUTH_CLIENT") private readonly authClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.authClient.subscribeToResponseOf("auth.register");
    this.authClient.subscribeToResponseOf("auth.login");
    await this.authClient.connect();
  }

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return firstValueFrom(
      this.authClient.send("auth.register", dto).pipe(timeout(5000)),
    );
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return firstValueFrom(
      this.authClient.send("auth.login", dto).pipe(timeout(5000)),
    );
  }
}
