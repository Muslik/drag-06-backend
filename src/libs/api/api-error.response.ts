import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';

import { ExceptionBase, RequestValidationError } from '../exceptions';

export class ApiErrorResponse implements ExceptionBase {
  @ApiProperty({ description: 'Тип ошибки', example: 'NOT_FOUND' })
  readonly type: string;

  @ApiProperty({ description: 'Код ошибки', example: 'EMPLOYEE_NOT_FOUND_ERROR_CODE' })
  readonly code: string;

  @ApiProperty({ description: 'Человеческое описание ошибки', example: 'Пользователь не найден' })
  readonly message: string;

  @ApiPropertyOptional({ description: 'Подробная информация об ошибке' })
  readonly inner?: unknown;
}

@ApiExtraModels(RequestValidationError)
export class ApiValidationErrorResponse implements ExceptionBase {
  @ApiProperty({ description: 'Тип ошибки', example: 'BAD_REQUEST' })
  readonly type: string;

  @ApiProperty({ description: 'Код ошибки', example: 'VALIDATION_ERROR' })
  readonly code: string;

  @ApiProperty({ description: 'Человеческое описание ошибки', example: 'Validation failed' })
  readonly message: string;

  @ApiProperty({
    description: 'Ошибки валидации',
    type: 'array',
    items: {
      type: 'object',
      $ref: getSchemaPath(RequestValidationError),
    },
  })
  readonly inner: RequestValidationError[];
}
