import { Test } from '@nestjs/testing';
import { just } from '@sweet-monads/maybe';

import { TOURNAMENT_REPOSITORY } from './tournament.constants';
import { TournamentService } from './tournament.service';

const repositoryMock = {
  findLatestActive: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
};

const availableNumbersBitsArr = Array.from({ length: 100 }, (_, i) => (i % 2 === 0 ? 1 : 0));
const availableNumbersArr = availableNumbersBitsArr.map((num, i) => (num === 1 ? i + 1 : null)).filter(Boolean);

const mockTournament = {
  id: 1,
  title: 'Tournament',
  description: 'description',
  createdAt: new Date(),
  startDate: new Date(),
  fee: 100,
  status: 'REGISTRATION' as const,
};

describe('TournamentService', () => {
  let tournamentService: TournamentService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TournamentService,
        {
          provide: TOURNAMENT_REPOSITORY,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    tournamentService = module.get<TournamentService>(TournamentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should return latest available tournament', async () => {
    repositoryMock.findLatestActive.mockResolvedValueOnce(
      just({
        ...mockTournament,
        availableRacerNumbers: availableNumbersBitsArr.join(''),
      }),
    );

    const result = await tournamentService.getLatestAvailableTournament();

    expect(result.unwrap()).toEqual({ ...mockTournament, availableRacerNumbers: availableNumbersArr });
  });

  it('Should return all tournaments', async () => {
    repositoryMock.findMany.mockResolvedValueOnce([
      {
        ...mockTournament,
        availableRacerNumbers: availableNumbersBitsArr.join(''),
      },
    ]);

    const result = await tournamentService.getTournaments({});

    expect(result).toEqual([{ ...mockTournament, availableRacerNumbers: availableNumbersArr }]);
  });

  it('should create tournament and return it', async () => {
    const { id, ...tournament } = mockTournament;
    repositoryMock.create.mockResolvedValueOnce({
      ...tournament,
      availableRacerNumbers: availableNumbersBitsArr.join(''),
    });

    const result = await tournamentService.createTournament({
      ...tournament,
      availableRacerNumbers: availableNumbersArr,
    });

    expect(result).toEqual({ ...tournament, availableRacerNumbers: availableNumbersArr });
  });
});
