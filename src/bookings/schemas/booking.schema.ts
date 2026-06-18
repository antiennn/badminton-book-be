import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { HydratedDocument } from 'mongoose';
import { BookingParticipant } from './booking-participant.schema';
import { User } from 'src/users/schemas/user.schema';

export type BookingDocument = HydratedDocument<Booking>;

@Schema({
  timestamps: true,
})
@ObjectType()
export class Booking {
  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  })
  location?: {
    type: string;
    coordinates: number[];
  };

  @Field(() => ID)
  _id!: string;

  @Prop({ required: true })
  @Field(() => [String])
  maleLevelRequired!: string[];

  @Prop({ required: true })
  @Field(() => [String])
  femaleLevelRequired!: string[];

  @Prop({ required: true })
  @Field()
  maleRequired!: number;

  @Prop({ required: true })
  @Field()
  femaleRequired!: number;

  @Prop({ required: true })
  @Field()
  startTime!: string;

  @Prop({ required: true })
  @Field()
  endTime!: string;

  @Prop({ required: true })
  @Field()
  day!: string;

  @Prop({ required: true })
  @Field(() => Float)
  malePrice!: number;

  @Prop({ required: true })
  @Field(() => Float)
  femalePrice!: number;

  @Prop({ required: true })
  @Field()
  address!: string;

  @Prop({ required: true })
  @Field(() => Float)
  longitude!: number;

  @Prop({ required: true })
  @Field(() => Float)
  latitude!: number;

  @Prop({ default: true })
  @Field(() => [String])
  facilities!: string[];

  @Prop({ required: true })
  @Field()
  userId!: string;

  @Prop({ required: true, default: 0 })
  @Field()
  maleJoined!: number;

  @Prop({ required: true, default: 0 })
  @Field()
  femaleJoined!: number;

  @Field(() => [BookingParticipant], {
    nullable: true,
  })
  participants?: BookingParticipant[];

  @Field(() => User, {
    nullable: true,
  })
  owner?: User;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.index({ location: '2dsphere' });
