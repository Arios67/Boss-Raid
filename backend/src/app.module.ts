import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  CacheModule,
} from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisClientOptions } from 'redis';
import * as redisStore from 'cache-manager-redis-store';
import { UserModule } from './apis/user/user.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { BossRaidModule } from './apis/bossRaid/bossRaid.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    UserModule,
    BossRaidModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'my_database',
      port: 3306,
      username: 'root',
      password: process.env.DB_ROOT_PASSWORD,
      database: 'boss_raid',
      entities: [__dirname + '/apis/**/*.entity.*'],
      synchronize: true,
      logging: true,
      charset: 'utf8mb4',
    }),
    CacheModule.register<RedisClientOptions>({
      store: redisStore,
      url: 'redis://my_redis:6379',
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(...[{ path: '/*', method: RequestMethod.ALL }]);
  }
}
