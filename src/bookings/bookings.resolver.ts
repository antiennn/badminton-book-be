import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { Booking } from './schemas/booking.schema';
import { BookingsService } from './bookings.service';
import { CreateBookingInput } from './dto/create-booking.input';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BookingParticipant } from './schemas/booking-participant.schema';
import { JoinBookingInput } from './dto/join-booking.input';
import { MyJoinedBookingsResponse } from './dto/get_all_join_match';

@Resolver(() => Booking)
export class BookingsResolver {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly bookingParticipantsService: BookingsService,
  ) {}

  @Query(() => [Booking])
  async bookings(
    @Args('day', { nullable: true }) day?: string,
    @Args('longitude', { nullable: true }) longitude?: number,
    @Args('latitude', { nullable: true }) latitude?: number,
    @Args('withinKm', { nullable: true }) withinKm?: number,
    @Args('page', {
      nullable: true,
      defaultValue: 1,
      type: () => Int,
    })
    page: number = 1,
    @Args('limit', {
      nullable: true,
      defaultValue: 10,
      type: () => Int,
    })
    limit: number = 10,
  ) {
    return this.bookingsService.findAll(
      day,
      longitude,
      latitude,
      withinKm,
      page,
      limit,
    );
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Booking])
  async myBookings(@CurrentUser() user: any) {
    return this.bookingsService.findByUser(user.sub);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Booking)
  async createBooking(
    @CurrentUser() user: any,
    @Args('input') input: CreateBookingInput,
  ) {
    return this.bookingsService.create(user.sub, input);
  }

  @Query(() => Booking, {
    nullable: true,
  })
  async booking(@Args('id', { type: () => ID }) id: string) {
    return this.bookingsService.findById(id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => BookingParticipant)
  joinBooking(
    @CurrentUser() user: any,
    @Args('input') input: JoinBookingInput,
  ) {
    return this.bookingParticipantsService.join(user.sub, input);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => MyJoinedBookingsResponse)
  myJoinedBookings(
    @CurrentUser() user: any,
  ) {
    return this.bookingParticipantsService.myJoinedBookings(
      user.sub,
    );
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => BookingParticipant)
  acceptParticipant(
    @CurrentUser() user: any,

    @Args('bookingId') bookingId: string,

    @Args('participantId') participantId: string,
  ) {
    return this.bookingParticipantsService.accept(
      bookingId,

      participantId,

      user.sub,
    );
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => BookingParticipant)
  rejectParticipant(
    @CurrentUser() user: any,

    @Args('bookingId') bookingId: string,

    @Args('participantId') participantId: string,
  ) {
    return this.bookingParticipantsService.reject(
      bookingId,

      participantId,

      user.sub,
    );
  }
}
