import { FactoryProvider, ModuleMetadata } from '@nestjs/common';

import { ISessionService } from 'src/modules/session';
import { ITokenService } from 'src/modules/token';
import { IUserService } from 'src/modules/user';

export interface IAuthServiceOptions {
  userService: IUserService;
  sessionService: ISessionService;
  tokenService: ITokenService;
}

export interface AuthModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: FactoryProvider<IAuthServiceOptions>['useFactory'];
  inject?: FactoryProvider['inject'];
}
