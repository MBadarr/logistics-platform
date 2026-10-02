import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@Controller()
@ApiTags('Application')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get the API greeting' })
  @ApiOkResponse({ schema: { type: 'string', example: 'Logistics Platform!' } })
  getHello(): string {
    return this.appService.getHello();
  }
}
