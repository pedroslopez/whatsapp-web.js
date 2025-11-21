import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({ example: 'Primary WhatsApp' })
  @IsString()
  @MinLength(2)
  name: string;
}
