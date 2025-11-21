import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional, IsBoolean } from 'class-validator';

export class UpdateAutomationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  trigger?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  actions?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
