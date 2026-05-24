import { Injectable } from '@nestjs/common';

import { PassportStrategy }
from '@nestjs/passport';

import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

import { ConfigService }
from '@nestjs/config';

import * as jwksRsa
from 'jwks-rsa';

@Injectable()
export class JwtStrategy
  extends PassportStrategy(
    Strategy,
    'jwt',
  )
{
  constructor(
    private readonly configService:
      ConfigService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      audience:
        configService.get<string>(
          'AUTH0_AUDIENCE',
        ),

      issuer:
        `https://${configService.get<string>(
          'AUTH0_DOMAIN',
        )}/`,

      algorithms: ['RS256'],

      secretOrKeyProvider:
        jwksRsa.passportJwtSecret({
          cache: true,

          rateLimit: true,

          jwksRequestsPerMinute: 5,

          jwksUri:
            `https://${configService.get<string>(
              'AUTH0_DOMAIN',
            )}/.well-known/jwks.json`,
        }) as any,
    });
  }

  async validate(payload: any) {
    return {
      sub: payload.sub,

      email: payload.email,

      name: payload.name,

      picture: payload.picture,
    };
  }
}