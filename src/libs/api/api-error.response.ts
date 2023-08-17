import { ApiProperty } from '@nestjs/swagger';
import { ExceptionBase } from '../exceptions';

export class ApiErrorResponse implements ExceptionBase {
  @ApiProperty({ description: 'Тип ошибки', example: 'NOT_FOUND' })
  readonly type: string;

  @ApiProperty({ description: 'Код ошибки', example: 'EMPLOYEE_NOT_FOUND_ERROR_CODE' })
  readonly code: string;

  @ApiProperty({ description: 'Человеческое описание ошибки', example: 'Пользователь не найден' })
  readonly message: string;

  @ApiProperty({ description: 'Подробная информация об ошибке', example: undefined })
  readonly inner?: unknown;
}
