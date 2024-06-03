import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';

import { ExceptionBase, RequestValidationErrorDto } from 'src/infrastructure/exceptions';

export class ApiErrorResponse implements ExceptionBase {
  @ApiProperty({ description: 'Error status code', example: 401 })
  readonly statusCode: number;

  @ApiProperty({ description: 'Error type', example: 'UNAUTHORIZED' })
  readonly type: string;

  @ApiProperty({ description: 'Error code', example: 'AUTH.INVALID_GRANT' })
  readonly code: string;

  @ApiProperty({ description: 'Error message', example: 'Token is not valid' })
  readonly message: string;

  @ApiPropertyOptional({ description: 'Error additional info' })
  readonly inner?: unknown;
}

@ApiExtraModels(RequestValidationErrorDto)
export class ApiValidationErrorResponse implements ExceptionBase {
  @ApiProperty({ description: 'Error status code', example: 400 })
  readonly statusCode: number;

  @ApiProperty({ description: 'Error type', example: 'BAD_REQUEST' })
  readonly type: string;

  @ApiProperty({ description: 'Error code', example: 'VALIDATION_ERROR' })
  readonly code: string;

  @ApiProperty({ description: 'Error message', example: 'Validation failed' })
  readonly message: string;

  @ApiProperty({
    description: 'Validation errors',
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(RequestValidationErrorDto) },
  })
  readonly inner: Record<string, RequestValidationErrorDto>;
}
