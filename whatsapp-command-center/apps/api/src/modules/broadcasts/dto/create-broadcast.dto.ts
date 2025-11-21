import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsDateString } from 'class-validator';

export class CreateBroadcastDto {
  @ApiProperty({ example: 'Summer Sale Announcement' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Check out our summer sale!' })
  @IsString()
  message: string;

  @ApiProperty({ required: false, example: ['contact-id-1', 'contact-id-2'] })
  @IsOptional()
  @IsArray()
  contactIds?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}
