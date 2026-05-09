import { ApiProperty } from "@nestjs/swagger";
import type { LoginPayload, RegisterPayload } from "@repo/api-types/auth";
import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto implements RegisterPayload {
  @ApiProperty({ example: "ops@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Operations Manager" })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginDto implements LoginPayload {
  @ApiProperty({ example: "ops@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  password!: string;
}
