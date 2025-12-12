import { Global, Module } from "@nestjs/common"
import { RedisService } from "./redis.service"
import { Cache } from "./cache"
import { ConfigService } from "@nestjs/config"

@Global()
@Module({
  providers: [
    Cache,
    {
      provide: RedisService,
      useFactory(config: ConfigService): RedisService {
        return new RedisService({
          host: config.getOrThrow("REDIS_HOST"),
          port: config.getOrThrow("REDIS_PORT")
        })
      },
      inject: [ConfigService]
    }
  ],
  exports: [Cache, RedisService]
})
export class CacheModule {}
