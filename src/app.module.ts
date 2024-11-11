import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageModule } from './message/message.module';
import {
  MessageEntity,
  MessageSchema,
} from './message/entities/message.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://hahuu:hahuudev@cluster0.d2zbh.mongodb.net/',
    ),
    MongooseModule.forFeature([
      { name: MessageEntity.name, schema: MessageSchema },
    ]),
    EventEmitterModule.forRoot(),
    MessageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
