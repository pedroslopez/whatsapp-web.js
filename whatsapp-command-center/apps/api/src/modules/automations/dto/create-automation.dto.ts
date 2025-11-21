import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional } from 'class-validator';

export class CreateAutomationDto {
  @ApiProperty({ example: 'Welcome Message' })
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: { type: 'new_conversation' } })
  @IsObject()
  trigger: any;

  @ApiProperty({ example: [{ type: 'send_message', config: { message: 'Welcome!' } }] })
  @IsObject()
  actions: any;
}
