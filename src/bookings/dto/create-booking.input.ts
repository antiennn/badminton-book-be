import { InputType, Field, Float } from '@nestjs/graphql';

@InputType()
export class CreateBookingInput {
  @Field(() => [String])
  maleLevelRequired!: string[];

  @Field(() => [String])
  femaleLevelRequired!: string[];

  @Field()
  maleRequired!: number;

  @Field()
  femaleRequired!: number;

  @Field()
  startTime!: string;

  @Field()
  endTime!: string;

  @Field()
  day!: string;

  @Field(() => Float)
  malePrice!: number;

  @Field(() => Float)
  femalePrice!: number;

  @Field()
  address!: string;

  @Field(() => Float)
  longitude!: number;

  @Field(() => Float)
  latitude!: number;

  @Field(() => [String])
  facilities!: string[];

}
