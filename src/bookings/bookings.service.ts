import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Booking } from './schemas/booking.schema';
import { CreateBookingInput } from './dto/create-booking.input';
import {
  BookingParticipant,
  BookingParticipantDocument,
} from './schemas/booking-participant.schema';
import { ParticipantStatus } from './enum/participant-status.enum';
import { JoinBookingInput } from './dto/join-booking.input';
import { UserService } from 'src/users/user.service';
import { User } from 'src/users/schemas/user.schema';

type JoinedBookingItem = BookingParticipant & {
  booking: Booking & {
    owner?: User | null;
  };
};

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name)
    private bookingModel: Model<Booking>,
    @InjectModel(BookingParticipant.name)
    private readonly bookingParticipantModel: Model<BookingParticipantDocument>,
    private readonly userService: UserService,
  ) {}

  private escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async create(userId: string, input: CreateBookingInput) {
    return this.bookingModel.create({
      ...input,
      userId,
      location: {
        type: 'Point',
        coordinates: [input.longitude, input.latitude],
      },
    });
  }

  async findById(id: string) {
    const booking = await this.bookingModel.findById(id).lean();

    if (!booking) {
      return null;
    }

    const participants = await this.bookingParticipantModel
      .find({
        bookingId: id,
      })
      .lean();

    const owner = await this.userService.findByAuth0Id(
      booking.userId,
    );

    const userIds = participants.map((p) => p.userId);

    const users = await this.userService
      .findByAuth0Ids(userIds);

    const userMap = new Map(
      users.map((user) => [user.auth0Id, user]),
    );

    const participantWithUser = participants.map(
      (participant) => ({
        ...participant,
        user: userMap.get(participant.userId) || null,
      }),
    );

    return {
      ...booking,
      participants: participantWithUser,
      owner,
    };
  }

  async findByUser(userId: string) {
    const bookings = await this.bookingModel
      .find({
        userId,
      })
      .lean();

    if (!bookings.length) {
      return [];
    }

    const bookingIds = bookings.map((booking) =>
      booking._id.toString(),
    );

    const participants =
      await this.bookingParticipantModel
        .find({
          bookingId: {
            $in: bookingIds,
          },
        })
        .lean();

    console.log('Participants:', participants);

    const participantUserIds = participants.map(
      (participant) => participant.userId,
    );

    const users = await this.userService.findByAuth0Ids(
      participantUserIds,
    );

    const userMap = new Map(
      users.map((user) => [user.auth0Id, user]),
    );

    const owner = await this.userService.findByAuth0Id(
      userId,
    );

    const participantMap = new Map<string, any[]>();

    participants.forEach((participant) => {
      const bookingId = participant.bookingId.toString();

      if (!participantMap.has(bookingId)) {
        participantMap.set(bookingId, []);
      }

      participantMap.get(bookingId)!.push({
        ...participant,
        user: userMap.get(participant.userId) || null,
      });
    });

    return bookings.map((booking) => ({
      ...booking,
      owner,
      participants:
        participantMap.get(booking._id.toString()) || [],
    }));
  }

  async findAll(
    day?: string,
    longitude?: number,
    latitude?: number,
    withinKm?: number,
    page = 1,
    limit = 10,
  ) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 100));
    const skip = (safePage - 1) * safeLimit;

    const filter = day
      ? {
          day: {
            $regex: new RegExp(`^${this.escapeRegExp(day)}$`, 'i'),
          },
        }
      : {};

    const now = new Date();

    const hasLocation =
      typeof longitude === 'number' &&
      Number.isFinite(longitude) &&
      typeof latitude === 'number' &&
      Number.isFinite(latitude);

    if (!hasLocation) {
      return this.bookingModel
        .find({
          ...filter,
          $expr: {
            $gte: [
              {
                $dateFromString: {
                  dateString: {
                    $concat: ["$day", "T", "$startTime", ":00"],
                  },
                },
              },
              now,
            ],
          },
        })
        .sort({ day: 1, startTime: 1 })
        .skip(skip)
        .limit(safeLimit);
    }

    const hasValidWithinKm =
      typeof withinKm === 'number' &&
      Number.isFinite(withinKm) &&
      withinKm >= 0;
    const maxDistanceKm = hasValidWithinKm ? withinKm : 10;

    return this.bookingModel.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          distanceField: 'distanceKm',
          distanceMultiplier: 0.001,
          maxDistance: maxDistanceKm * 1000,
          query: filter,
          spherical: true,
        },
      },
      {
        $match: {
          $expr: {
            $gte: [
              {
                $dateFromString: {
                  dateString: {
                    $concat: ["$day", "T", "$startTime", ":00"],
                  },
                },
              },
              now,
            ],
          },
        },
      },
      {
        $sort: {
          day: 1,
          startTime: 1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: safeLimit,
      },
    ]);
  }

  async join(auth0Id: string, input: JoinBookingInput) {
    const booking = await this.bookingModel.findById(input.bookingId);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId === auth0Id) {
      throw new BadRequestException('Cannot join your own booking');
    }

    const existed = await this.bookingParticipantModel.findOne({
      bookingId: input.bookingId,
      userId: auth0Id,
    });

    if (existed) {
      throw new BadRequestException('Already joined');
    }

    const user = await this.userService.findByAuth0Id(auth0Id);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isMale = user.gender === "Male";

    const requiredLevels = isMale
      ? booking.maleLevelRequired
      : booking.femaleLevelRequired;

    if (
      requiredLevels?.length &&
      !requiredLevels.includes(user.level || '')
    ) {
      throw new BadRequestException(
        "Your level does not match this booking",
      );
    }

    if (isMale) {
      if (booking.maleJoined >= booking.maleRequired) {
        throw new BadRequestException(
          "Male slots are full",
        );
      }
    } else {
      if (booking.femaleJoined >= booking.femaleRequired) {
        throw new BadRequestException(
          "Female slots are full",
        );
      }
    }


    const participant =
      await this.bookingParticipantModel.create({
        bookingId: input.bookingId,
        userId: auth0Id,
        gender: user.gender,
        level: user.level,
        status: ParticipantStatus.PENDING,
        message: input.message,
      });

    return participant;
  }

  async myJoinedBookings(auth0Id: string) {
    const participants =
      await this.bookingParticipantModel
        .find({
          userId: auth0Id,
        })
        .lean();

    if (!participants.length) {
      return {
        upcoming: [],
        pending: [],
        history: [],
      };
    }

    const bookingIds = participants.map(
      (item) => item.bookingId,
    );

    const bookings = await this.bookingModel
      .find({
        _id: {
          $in: bookingIds,
        },
      })
      .lean();

    const ownerIds = [...new Set(bookings.map((booking) => booking.userId))];

    const owners = ownerIds.length
      ? await this.userService.findByAuth0Ids(ownerIds)
      : [];

    const ownerMap = new Map(
      owners.map((user) => [user.auth0Id, user]),
    );

    const enrichedBookings = bookings.map((booking) => ({
      ...booking,
      owner: ownerMap.get(booking.userId) || null,
    })) as Array<Booking & { owner: User | null }>;

    const bookingMap = new Map(
      enrichedBookings.map((booking) => [
        booking._id.toString(),
        booking,
      ]),
    );

    const now = new Date();

    const result: {
      upcoming: JoinedBookingItem[];
      pending: JoinedBookingItem[];
      history: JoinedBookingItem[];
    } = {
      upcoming: [],
      pending: [],
      history: [],
    };

    for (const participant of participants) {
      const booking = bookingMap.get(
        participant.bookingId.toString(),
      );

      if (!booking) {
        continue;
      }

      const bookingDate = new Date(
        `${booking.day}T${booking.endTime}:00`,
      );

      const item: JoinedBookingItem = {
        ...participant,
        booking,
      };

      if (participant.status === "PENDING") {
        result.pending.push(item);
        continue;
      }

      if (
        participant.status === "ACCEPTED" &&
        bookingDate > now
      ) {
        result.upcoming.push(item);
        continue;
      }

      result.history.push(item);
    }

    return result;
  }

  async accept(
    bookingId: string,
    participantId: string,
    organizerId: string,
  ) {
    const booking = await this.bookingModel.findById(bookingId);

    if (!booking) {
      throw new NotFoundException();
    }

    if (booking.userId !== organizerId) {
      throw new ForbiddenException();
    }

    const participant =
      await this.bookingParticipantModel.findById(participantId);

    if (!participant) {
      throw new NotFoundException("Participant not found");
    }

    if (participant.status === ParticipantStatus.ACCEPTED) {
      return participant;
    }

    const isMale = participant.gender === "Male";

    if (isMale) {
      if (booking.maleJoined >= booking.maleRequired) {
        throw new BadRequestException(
          "Male slots are full",
        );
      }
    } else {
      if (booking.femaleJoined >= booking.femaleRequired) {
        throw new BadRequestException(
          "Female slots are full",
        );
      }
    }

    await this.bookingParticipantModel.findByIdAndUpdate(
      participantId,
      {
        status: ParticipantStatus.ACCEPTED,
      },
    );

    await this.bookingModel.findByIdAndUpdate(
      bookingId,
      {
        $inc: {
          [isMale ? "maleJoined" : "femaleJoined"]: 1,
        },
      },
    );

    return this.bookingParticipantModel.findById(participantId);
  }

  async reject(bookingId: string, participantId: string, organizerId: string) {
    const booking = await this.bookingModel.findById(bookingId);

    if (!booking) {
      throw new NotFoundException();
    }

    if (booking.userId !== organizerId) {
      throw new ForbiddenException();
    }

    return this.bookingParticipantModel.findByIdAndUpdate(
      participantId,
      {
        status: ParticipantStatus.REJECTED,
      },
      {
        new: true,
      },
    );
  }
}
