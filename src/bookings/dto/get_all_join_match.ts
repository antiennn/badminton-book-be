import { Field, ObjectType } from "@nestjs/graphql";
import { BookingParticipant } from "../schemas/booking-participant.schema";

@ObjectType()
export class MyJoinedBookingsResponse {
  @Field(() => [BookingParticipant])
  upcoming!: BookingParticipant[];

  @Field(() => [BookingParticipant])
  pending!: BookingParticipant[];

  @Field(() => [BookingParticipant])
  history!: BookingParticipant[];
}