import enJson from './translations/en.json';

export type TranslationsSchema = typeof enJson;
export type TranslationKey = string;
export type InterpolationParams = Record<string, string | number>;
