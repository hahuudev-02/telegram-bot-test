import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<MessageEntity>;
export type ITypeUser = 'BOT' | 'USER';
export type ITypeMessage = 'TEXT' | 'FILE';

@Schema({ collection: 'message', timestamps: true })
export class MessageEntity {
  @Prop()
  chanelId: string;

  @Prop()
  messageId: string;

  @Prop()
  username: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  typeUser: ITypeUser;

  @Prop()
  typeMessage: ITypeMessage;

  @Prop()
  text: string;
}

export const MessageSchema = SchemaFactory.createForClass(MessageEntity);
