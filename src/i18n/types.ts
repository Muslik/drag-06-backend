import { Path } from 'nestjs-i18n';

import translationsJson from './ru/translations.json';

// FIXME: Почему то генерация не работает. Поэтому пока что вручную создаем типы

export type I18nTranslations = {
  translations: typeof translationsJson;
};
export type I18nPath = Path<I18nTranslations>;
