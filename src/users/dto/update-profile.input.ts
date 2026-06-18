import {
  InputType,
  Field,
  Int,
} from '@nestjs/graphql';

@InputType()
export class UpdateProfileInput {
  @Field()
  level!: string;

  @Field(() => [String])
  availableDays!: string[];

  @Field(() => [String])
  availableTimes!: string[];

  @Field(() => Int)
  expectedPrice!: number;

  @Field(() => String)
  gender !: string;
}