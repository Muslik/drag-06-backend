import { Test } from '@nestjs/testing';
import { just, none } from '@sweet-monads/maybe';

import { TOURNAMENT_SERVICE } from './tournament.constants';
import { TournamentController } from './tournament.controller';
import { ITournamentService } from './tournament.service.interface';

const mockTournament = {
  id: 1,
  fee: 100,
  title: 'test-title',
  status: 'CREATED' as const,
  startDate: new Date(),
  description: 'test-description',
  availableRacerNumbers: [1, 2, 3],
};

const mockTournamentService: ITournamentService = {
  getLatestAvailableTournament: jest.fn(),
  getTournaments: jest.fn(),
  createTournament: jest.fn(),
};

describe('TournamentController', () => {
  let tournamentController: TournamentController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TournamentController],
      providers: [{ provide: TOURNAMENT_SERVICE, useValue: mockTournamentService }],
    }).compile();

    tournamentController = module.get<TournamentController>(TournamentController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return tournaments list', async () => {
      jest.spyOn(mockTournamentService, 'getTournaments').mockResolvedValueOnce([mockTournament]);

      const result = await tournamentController.getTournaments({});

      expect(result).toEqual([mockTournament]);
    });
  });

  describe('GET /latest-available', () => {
    it('should return latest available tournament if available', async () => {
      jest.spyOn(mockTournamentService, 'getLatestAvailableTournament').mockResolvedValueOnce(just(mockTournament));

      const result = await tournamentController.getLatestAvailableTournament();

      expect(result).toEqual(mockTournament);
    });

    it('should return null if not available', async () => {
      jest.spyOn(mockTournamentService, 'getLatestAvailableTournament').mockResolvedValueOnce(none());

      const result = await tournamentController.getLatestAvailableTournament();

      expect(result).toEqual(null);
    });
  });

  describe('POST /', () => {
    it('should create tournament', async () => {
      jest.spyOn(mockTournamentService, 'createTournament').mockResolvedValueOnce(mockTournament);

      const result = await tournamentController.createTournament(mockTournament);

      expect(result).toEqual(mockTournament);
    });
  });
});
