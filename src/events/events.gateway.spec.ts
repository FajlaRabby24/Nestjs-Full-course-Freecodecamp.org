import { Test, TestingModule } from '@nestjs/testing';
import { EventsGateway } from './events.gateway.js';
import { EventsService } from './events.service.js';
import { AuthService } from '../auth/auth.service.js';

describe('EventsGateway', () => {
  let gateway: EventsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsGateway,
        {
          provide: EventsService,
          useValue: {
            saveMessage: vi.fn(),
            getRoomHistory: vi.fn().mockResolvedValue([]),
            getDirectMessageHistory: vi.fn().mockResolvedValue([]),
            upsertUser: vi.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            verifyToken: vi.fn(),
            generateToken: vi.fn(),
            getDemoUsers: vi.fn().mockReturnValue([]),
          },
        },
      ],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
