import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { User } from './schemas/user.schema';
import { UserService } from './user.service';

import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { UpdateProfileInput } from './dto/update-profile.input';
import { LoginInput } from './dto/login.input';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
  ) {}

  @Query(() => [User])
  // @UseGuards(GqlAuthGuard)
  async users() {
    return this.userService.findAll();
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => User)
  async me(
    @CurrentUser() user: any,
  ) {
    console.log(user);
    return this.userService.findOrCreate(
      user,
    );
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => User)
  async updateProfile(
    @CurrentUser() user: any,

    @Args('input')
    input: UpdateProfileInput,
  ) {
    return this.userService.updateProfile(
      user.sub,
      input,
    );
  }

  @Mutation(() => User)
    async syncUser(
      @Args('input')
      input: LoginInput,
    ) {
      return this.userService.syncUser(
        input,
      );
    }
}