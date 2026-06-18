import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ParticipantStatus } from '../enum/participant-status.enum';
import { User } from 'src/users/schemas/user.schema';
import { Booking } from './booking.schema';

export type BookingParticipantDocument = HydratedDocument<BookingParticipant>;

@Schema({
  timestamps: true,
})
@ObjectType()
export class BookingParticipant {
  @Field(() => ID)
  _id!: string;

  @Prop({
    type: Types.ObjectId,
    required: true,
    index: true,
  })
  @Field()
  bookingId!: string;

  @Prop({
    required: true,
    index: true,
  })
  @Field()
  userId!: string;

  @Prop({
    required: true,
  })
  @Field()
  gender!: string;

  @Prop({
    required: true,
  })
  @Field()
  level!: string;

  @Prop({
    enum: ParticipantStatus,
    default: ParticipantStatus.PENDING,
  })
  @Field(() => ParticipantStatus)
  status!: ParticipantStatus;

  @Prop()
  @Field({
    nullable: true,
  })
  message?: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field(() => User, {
    nullable: true,
  })
  user?: User;

  @Field(() => Booking, {
    nullable: true,
  })
  booking?: Booking;
}

export const BookingParticipantSchema =
  SchemaFactory.createForClass(BookingParticipant);

BookingParticipantSchema.index({
  bookingId: 1,
  userId: 1,
});
