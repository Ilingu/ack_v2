import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheService } from './cache.service';

// V3: scheduling app cache (every day, at 00h00) with: [https://docs.nestjs.com/techniques/task-scheduling]

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: [`.env.${process.env.STAGE}`] }),
    CacheModule.register(),
  ],
  controllers: [AppController],
  providers: [AppService, CacheService],
})
export class AppModule {}
