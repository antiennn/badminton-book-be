import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
})
@ObjectType()
export class User {
  @Field(() => ID)
  _id!: string;

  @Prop({
    unique: true,
  })
  @Field()
  auth0Id!: string;

  @Prop()
  @Field()
  email!: string;

  @Prop()
  @Field()
  name!: string;

  @Prop()
  @Field({
    nullable: true,
  })
  avatar?: string;

  @Prop({
    default: false,
  })
  @Field()
  profileCompleted!: boolean;

  @Prop({
    nullable: true,
  })
  @Field({
    nullable: true,
  })
  level?: string;

  @Prop({
    type: [String],
    default: [],
  })
  @Field(() => [String])
  availableDays!: string[];

  @Prop({
    type: [String],
    default: [],
  })
  @Field(() => [String])
  availableTimes!: string[];

  @Prop({
    nullable: true,
  })
  @Field({
    nullable: true,
  })
  expectedPrice?: number;

  @Prop({
    default: 100,
  })
  @Field()
  reputationScore!: number;
  
}

export const UserSchema = SchemaFactory.createForClass(User);