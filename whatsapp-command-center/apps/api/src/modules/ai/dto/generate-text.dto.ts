import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, Min, Max } from 'class-validator';

export class GenerateTextDto {
  @ApiProperty({ example: 'Write a professional response to this customer inquiry' })
  @IsString()
  prompt: string;

  @ApiProperty({ required: false, example: ['Customer asked about pricing', 'Previous conversation was friendly'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  context?: string[];

  @ApiProperty({ required: false, example: 'You are a helpful customer support assistant' })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiProperty({ required: false, example: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiProperty({ required: false, example: 500 })
  @IsOptional()
  @IsNumber()
  maxTokens?: number;
}
