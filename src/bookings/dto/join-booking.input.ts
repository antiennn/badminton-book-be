import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

@InputType()
export class JoinBookingInput {
  @Field(() => ID)
  @IsMongoId()
  bookingId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  message?: string;
}