import { ApiProperty } from '@nestjs/swagger';

// OpenAPI models; runtime validation remains in auth.validation.ts.
export class EmailDto {
  @ApiProperty({ format: 'email', maxLength: 254, example: 'alex@example.com' })
  email!: string;
}

export class LoginDto extends EmailDto {
  @ApiProperty({
    format: 'password',
    minLength: 1,
    maxLength: 128,
    example: 'a-long-example-password',
  })
  password!: string;
}

export class SignupDto extends EmailDto {
  @ApiProperty({ minLength: 2, maxLength: 100, example: 'Alex Smith' })
  name!: string;

  @ApiProperty({
    format: 'password',
    minLength: 12,
    maxLength: 128,
    example: 'a-long-example-password',
  })
  password!: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    pattern: '^[a-f0-9]{64}$',
    description:
      'Single-use token from the email reset link. Expires after 30 minutes.',
  })
  token!: string;

  @ApiProperty({
    format: 'password',
    minLength: 12,
    maxLength: 128,
    example: 'another-long-example-password',
  })
  password!: string;
}

export class UserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Alex Smith' })
  name!: string;

  @ApiProperty({ format: 'email', example: 'alex@example.com' })
  email!: string;
}

export class AuthResponseDto {
  @ApiProperty({ type: UserDto })
  user!: UserDto;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Signed out' })
  message!: string;
}
