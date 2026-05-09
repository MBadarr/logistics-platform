import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { LoginPayload, RegisterPayload } from "@repo/api-types/auth";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "./prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(payload: RegisterPayload) {
    const existing = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (existing) {
      throw new ConflictException("A user with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: payload.email,
        name: payload.name,
        passwordHash,
      },
    });

    return this.toAuthResponse(user);
  }

  async login(payload: LoginPayload) {
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const isValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    return this.toAuthResponse(user);
  }

  private toAuthResponse(user: {
    id: string;
    email: string;
    name: string;
    role: string;
  }) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
