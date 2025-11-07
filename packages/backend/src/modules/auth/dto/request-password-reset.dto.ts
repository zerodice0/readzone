import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * DTO for requesting password reset
 */
export class RequestPasswordResetDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;
}
