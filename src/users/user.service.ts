import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from './schemas/user.schema';
import { UpdateProfileInput } from './dto/update-profile.input';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async findAll() {
    return this.userModel.find();
  }

  async findOrCreate(authUser: any) {
    let user =
      await this.userModel.findOne({
        auth0Id: authUser.sub,
      });

    if (!user) {
      user =
        await this.userModel.create({
          auth0Id: authUser.sub,

          email: authUser.email,

          name:
            authUser.name ||
            authUser.nickname,

          avatar: authUser.picture,

          profileCompleted: false,

          reputationScore: 100,

          availableDays: [],

          availableTimes: [],
        });
    }

    return user;
  }

  async updateProfile(
    auth0Id: string,
    input: UpdateProfileInput,
  ) {
    return this.userModel.findOneAndUpdate(
      {
        auth0Id,
      },
      {
        ...input,

        profileCompleted: true,
      },
      {
        new: true,
      },
    );
  }

  async syncUser(input: any) {

    let user =
      await this.userModel.findOne({
        auth0Id:
          input.auth0Id,
      });

    if (!user) {

      user =
        await this.userModel.create({
          auth0Id:
            input.auth0Id,

          email:
            input.email,

          name:
            input.name,

          avatar:
            input.picture,

          profileCompleted:
            false,
        });

      return user;
    }

    user.email =
      input.email;

    user.name =
      input.name;

    user.avatar =
      input.picture;

    await user.save();

    return user;
  }
}