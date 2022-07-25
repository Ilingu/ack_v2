/* eslint-disable prettier/prettier */
import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CachedDOMShape } from './Interfaces/interfaces';

@Injectable()
export class CacheService {
  private logger = new Logger('CacheService');
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getCache(key: string): Promise<CachedDOMShape> {
    this.logger.log(`Get Data From "${key}"`);
    const DOMObejct: string = await this.cacheManager.get(key);
    return JSON.parse(DOMObejct || null);
  }

  async setNewCache(key: string, value: CachedDOMShape): Promise<string> {
    this.logger.log(`Set Data To "${key}"`);
    return this.cacheManager.set(key, JSON.stringify(value), {
      ttl: 3600,
    });
  }
}
