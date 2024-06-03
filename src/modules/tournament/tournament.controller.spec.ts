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
  createdAt: new Date(),
  startDate: new Date(),
  description: 'test-description',
  availableRacerNumbers: [1, 2, 3],
};

const mockTournamentService: ITournamentService = {
  getTournaments: jest.fn(),
  createTournament: jest.fn(),
  getTournamentById: jest.fn(),
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

      const query = {
        'skip': 1,
        'take': 10,
        'order[field]': 'createdAt',
        'order[direction]': 'asc',
      } as const;

      const result = await tournamentController.getTournaments(query);

      expect(mockTournamentService.getTournaments).toHaveBeenCalledWith(query);
      expect(result).toEqual([mockTournament]);
    });
  });

  describe('GET /:id', () => {
    it('should return tournament by id', async () => {
      jest.spyOn(mockTournamentService, 'getTournamentById').mockResolvedValueOnce(just(mockTournament));

      const result = await tournamentController.getTournamentById(1);

      expect(mockTournamentService.getTournamentById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTournament);
    });

    it('should return null if not available', async () => {
      jest.spyOn(mockTournamentService, 'getTournamentById').mockResolvedValueOnce(none());

      const result = await tournamentController.getTournamentById(1);

      expect(mockTournamentService.getTournamentById).toHaveBeenCalledWith(1);
      expect(result).toEqual(null);
    });
  });

  describe('POST /', () => {
    it('should create tournament', async () => {
      jest.spyOn(mockTournamentService, 'createTournament').mockResolvedValueOnce(mockTournament);

      const result = await tournamentController.createTournament(mockTournament);

      expect(mockTournamentService.createTournament).toHaveBeenCalledWith(mockTournament);
      expect(result).toEqual(mockTournament);
    });
  });
});
