import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, IsArray, IsOptional } from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty({ example: 'My Webhook' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://example.com/webhook' })
  @IsUrl()
  url: string;

  @ApiProperty({ example: ['message.received', 'conversation.created'] })
  @IsArray()
  @IsString({ each: true })
  events: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  secret?: string;
}
