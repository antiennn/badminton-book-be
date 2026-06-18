import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

import { UserService } from './user.service';
import { User, UserSchema } from './schemas/user.schema';

describe('UserService', () => {
  let service: UserService;
  let userModel: {
    findOneAndUpdate: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(async () => {
    userModel = {
      findOneAndUpdate: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should keep avatar from the sync input for existing users', async () => {
    const existingUser = {
      email: 'old@example.com',
      name: 'Old Name',
      avatar: 'old-avatar',
      save: jest.fn().mockResolvedValue(true),
    };

    userModel.findOne.mockResolvedValue(existingUser);

    await service.syncUser({
      auth0Id: 'auth0|user-1',
      email: 'new@example.com',
      name: 'New Name',
      avatar: 'new-avatar',
    });

    expect(existingUser.avatar).toBe('new-avatar');
    expect(existingUser.save).toHaveBeenCalled();
  });

  it('should persist gender and expectedPrice in the update profile flow', async () => {
    userModel.findOneAndUpdate.mockResolvedValue({
      _id: 'user-1',
      gender: 'male',
      expectedPrice: 150,
    });

    await service.updateProfile('auth0|user-1', {
      level: 'intermediate',
      availableDays: ['Monday'],
      availableTimes: ['18:00'],
      expectedPrice: 150,
      gender: 'male',
    } as any);

    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { auth0Id: 'auth0|user-1' },
      expect.objectContaining({
        gender: 'male',
        expectedPrice: 150,
        profileCompleted: true,
      }),
      { new: true },
    );
  });

  it('should register gender and expectedPrice in the user schema', () => {
    expect(UserSchema.path('gender')).toBeDefined();
    expect(UserSchema.path('expectedPrice')).toBeDefined();
  });
});
