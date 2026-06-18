import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Booking, BookingSchema } from './schemas/booking.schema';
import { BookingsResolver } from './bookings.resolver';
import { BookingsService } from './bookings.service';
import { BookingParticipant, BookingParticipantSchema } from './schemas/booking-participant.schema';
import { UserModule } from 'src/users/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Booking.name,
        schema: BookingSchema,
      },
      {
        name: BookingParticipant.name,
        schema: BookingParticipantSchema,
      },
    ]),
    UserModule,
  ],
  providers: [BookingsResolver, BookingsService],
})
export class BookingsModule {}
