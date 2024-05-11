import { Path } from 'nestjs-i18n';

// FIXME: Почему то генераця не работает. Поэтому пока что вручную создаем типы

export type I18nTranslations = {
  translations: {
    error: {
      unexpected: string;
    };
    validationFailed: string;
    validation: {
      isString: string;
      isNumber: string;
      isBoolean: string;
      isNotEmpty: string;
      isDate: string;
      isEmail: string;
      isIn: string;
    };
  };
};
export type I18nPath = Path<I18nTranslations>;
