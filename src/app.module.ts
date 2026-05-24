import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MongooseModule } from '@nestjs/mongoose';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,

      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),

      playground: true,

      context: ({ req }) => ({
        req,
      }),
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (
        config: ConfigService,
      ) => ({
        uri: config.get<string>(
          'MONGO_URL',
        ),
      }),
    }),

    UserModule,

    AuthModule,
  ],
})
export class AppModule {}