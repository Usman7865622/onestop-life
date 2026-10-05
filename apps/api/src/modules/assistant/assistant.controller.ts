import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { AssistantChatDto } from './dto/assistant-chat.dto';
import { AssistantService } from './assistant.service';

@Public()
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Post('chat')
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  chat(@Body() dto: AssistantChatDto) {
    return this.assistant.chat(dto.messages);
  }
}
