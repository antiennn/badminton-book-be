import { registerEnumType } from '@nestjs/graphql';

export enum ParticipantStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  LEFT = 'LEFT',
}

registerEnumType(ParticipantStatus, {
  name: 'ParticipantStatus',
});