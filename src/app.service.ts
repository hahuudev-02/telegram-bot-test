import { Injectable, OnModuleInit } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TelegramBot = require('node-telegram-bot-api');

import { GoogleGenerativeAI } from '@google/generative-ai';
import { InjectModel } from '@nestjs/mongoose';
import { MessageEntity } from './message/entities/message.entity';
import { Model } from 'mongoose';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import axios from 'axios';

@Injectable()
export class AppService implements OnModuleInit {
  private bot: any;
  private model: any;
  private readonly token: string =
    '8097173882:AAGtp_9ai6JNYc9VICySABH3VNhdmeIWW_s';
  private readonly apiKeyGemini: string =
    'AIzaSyARI91qoXendHzvw561CXMdbokI6ALOZ20';

  constructor(
    @InjectModel(MessageEntity.name) private messageModel: Model<MessageEntity>,
    private eventEmitter: EventEmitter2,
  ) {
    setInterval(() => {
      this.callRestartServiceRender();
    }, 6000);
  }

  onModuleInit() {
    if (this.token) {
      this.bot = new TelegramBot(this.token, { polling: true });
      this.setupMessageHandler();
      const genAI = new GoogleGenerativeAI(this.apiKeyGemini);

      this.model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });
    } else {
      console.error('TELEGRAM_BOT_TOKEN không được cấu hình');
    }
  }

  private setupMessageHandler() {
    this.bot.on('message', async (msg) => {
      const chanelId = msg.chat.id;
      try {
        await this.bot.sendChatAction(chanelId, 'typing');

        const loadingMessage = await this.bot.sendMessage(
          chanelId,
          '<b style="color: red">Đang nhập...</b>',
          {
            parse_mode: 'HTML',
          },
        );

        const listMessageChanel = await this.messageModel
          .find({ chanelId })
          .sort({ createdAt: -1 })
          .select('typeUser typeMessage text createdAt chanelId')
          .limit(40);

        if (
          listMessageChanel.length > 0 &&
          listMessageChanel[0].typeUser === 'BOT'
        ) {
          listMessageChanel.shift();
        }

        const chat = await this.model.startChat({
          history: [
            ...listMessageChanel.map((message) => ({
              role: message.typeUser === 'BOT' ? 'model' : 'user',
              parts: [{ text: message.text }],
            })),
          ],
        });

        const result = await chat.sendMessage(msg.text || '');

        const newMessageUser = {
          chanelId,
          messageId: msg.id,
          username: msg?.from?.username || null,
          firstName: msg?.from?.first_name || null,
          lastName: msg?.from?.last_name,
          typeUser: 'USER',
          typeMessage: msg?.text ? 'TEXT' : 'FILE',
          text: msg?.text || null,
        };

        const newMessageBot = {
          chanelId,
          messageId: msg.id,
          username: null,
          firstName: null,
          lastName: null,
          typeUser: 'BOT',
          typeMessage: 'TEXT',
          text: result.response.text() || null,
        };

        await this.bot.editMessageText(result.response.text(), {
          chat_id: chanelId,
          message_id: loadingMessage.message_id,
        });

        this.eventEmitter.emit('save-message', {
          newMessageUser,
          newMessageBot,
        });
      } catch (error) {
        console.log(error);
        await this.bot.sendMessage(
          chanelId,
          'Đã xảy ra lỗi, vui lòng thử lại.',
        );
      }
    });
  }

  @OnEvent('save-message')
  async handleOrderEvents(payload: any) {
    const { newMessageUser, newMessageBot } = payload;
    if (newMessageUser && newMessageBot) {
      await this.messageModel.create(newMessageUser);
      await this.messageModel.create(newMessageBot);
      console.log('Create new message successfully!');
    }
  }

  async callRestartServiceRender() {
    try {
      const result = await axios.get(
        'https://telegram-bot-test-904q.onrender.com/',
      );

      console.log('connect-success', JSON.stringify(result));
    } catch (error) {
      console.log('connect-error', JSON.stringify(error));
    }
  }
}
