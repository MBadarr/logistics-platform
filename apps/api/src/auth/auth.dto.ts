import { ApiProperty } from '@nestjs/swagger';
export class UserDto {
  @ApiProperty({ description: 'Neon Auth user ID' })
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
