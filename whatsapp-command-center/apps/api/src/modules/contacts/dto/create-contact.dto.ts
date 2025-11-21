import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsObject } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: '1234567890@c.us' })
  @IsString()
  whatsappId: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ required: false, example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: { company: 'Acme Corp', role: 'Manager' } })
  @IsOptional()
  @IsObject()
  customFields?: any;
}
