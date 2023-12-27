import { FactoryProvider, ModuleMetadata } from '@nestjs/common';
import { ISessionService } from 'src/modules/session';
import { ITokenService } from 'src/modules/token';
import { IUsersService } from 'src/modules/users';

export interface IAuthServiceOptions {
  usersService: IUsersService;
  sessionService: ISessionService;
  tokenService: ITokenService;
}

export interface AuthModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: FactoryProvider<IAuthServiceOptions>['useFactory'];
  inject?: FactoryProvider['inject'];
}
