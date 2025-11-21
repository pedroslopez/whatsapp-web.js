import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { AiProviderType } from '@repo/database';

export class CreateAiProviderDto {
  @ApiProperty({ enum: AiProviderType, example: 'OPENAI' })
  @IsEnum(AiProviderType)
  provider: AiProviderType;

  @ApiProperty({ example: 'sk-...' })
  @IsString()
  apiKey: string;

  @ApiProperty({ example: 'gpt-4' })
  @IsString()
  model: string;

  @ApiProperty({ required: false, example: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiProperty({ required: false, example: 1024 })
  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @ApiProperty({ required: false, example: 'https://api.custom-llm.com' })
  @IsOptional()
  @IsString()
  baseUrl?: string;
}
