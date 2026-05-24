import {
  Field,
  InputType,
} from '@nestjs/graphql';

@InputType()
export class LoginInput {

  @Field()
  auth0Id!: string;

  @Field()
  email!: string;

  @Field()
  name!: string;

  @Field()
  picture!: string;
}