import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: '1234567890@c.us' })
  @IsString()
  @Matches(/^[0-9]+@c\.us$/, {
    message: 'Phone number must be in format: 1234567890@c.us',
  })
  to: string;

  @ApiProperty({ example: 'Hello, this is a test message!' })
  @IsString()
  message: string;
}
