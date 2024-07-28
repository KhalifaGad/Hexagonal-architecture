import {
  DynamicModule,
  Global,
  InternalServerErrorException,
  Module,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationBootstrapOptions } from 'src/common/interfaces/application-bootstrap.options';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import configuration, { IPostgresDatabaseConfig } from './configuration';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
})
export class ConfigurationModule {
  static forRoot(options: ApplicationBootstrapOptions) {
    const imports: DynamicModule[] = [];

    if (options.driver === 'orm') {
      imports.push(
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => {
            const databaseConfig =
              configService.get<IPostgresDatabaseConfig>('postgres');
            if (!databaseConfig)
              throw new InternalServerErrorException(
                'Cannot find database configuration',
              );

            return {
              type: 'postgres',
              debug: true,
              host: databaseConfig.host,
              port: databaseConfig.port,
              username: databaseConfig.username,
              password: databaseConfig.password,
              database: databaseConfig.name,
              synchronize: true,
              autoLoadEntities: true,
              namingStrategy: new SnakeNamingStrategy(),
            };
          },
          inject: [ConfigService],
        }),
      );
    }

    return {
      module: ConfigurationModule,
      imports,
    };
  }
}
