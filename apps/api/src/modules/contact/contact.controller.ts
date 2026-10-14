import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { RoleKey } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/contact.dto';

@Controller()
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  /** Public contact form submission. */
  @Post('contact')
  @Public()
  submit(@Body() dto: CreateContactMessageDto) {
    return this.contact.create(dto);
  }

  /** Admin inbox: read contact messages. */
  @Get('contact-messages')
  @Roles(RoleKey.ADMIN)
  list() {
    return this.contact.listUnread();
  }

  @Patch('contact-messages/:id/read')
  @Roles(RoleKey.ADMIN)
  markRead(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.contact.markRead(id);
  }
}
