import { Module } from '@nestjs/common';
import { MessageController } from './message.controller';

@Module({
  controllers: [MessageController],
  providers: [],
})
export class MessageModule {}
