import { Controller, Get, Logger, NotFoundException } from '@nestjs/common';
import { AppService } from './app.service';
import { AdkamiNewEpisodeShape } from './Interfaces/interfaces';

@Controller()
export class AppController {
  private logger = new Logger('AppController');
  constructor(private readonly appService: AppService) {}

  @Get('/last')
  async getLastest(): Promise<AdkamiNewEpisodeShape[]> {
    const LastReleasedEP = await this.appService.handleNewRequest();
    if (!LastReleasedEP) throw new NotFoundException();
    return LastReleasedEP;
  }
}
