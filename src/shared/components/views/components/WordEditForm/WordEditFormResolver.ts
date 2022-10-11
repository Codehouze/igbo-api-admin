import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Tense from 'src/backend/shared/constants/Tense';
import WordAttributes from 'src/backend/shared/constants/WordAttributes';
import WordClass from 'src/shared/constants/WordClass';
import { ExampleEditFormSchema } from '../ExampleEditForm/ExampleEditFormResolver';

const schema = yup.object().shape({
  attributes: yup.object().shape(Object.entries(WordAttributes).reduce((finalAttributes, [, { value }]) => ({
    ...finalAttributes,
    [value]: (value === WordAttributes.IS_SLANG.value || value === WordAttributes.IS_CONSTRUCTED_TERM.value)
      ? yup.boolean().optional()
      : yup.boolean(),
  }), {})),
  word: yup.string().required(),
  wordClass: yup.object().shape({
    value: yup.mixed().oneOf(Object.values(WordClass).map(({ value }) => value)),
    label: yup.mixed().oneOf(Object.values(WordClass).map(({ label }) => label)),
  }).required(),
  tags: yup.array().min(0).of(yup.string()),
  definitions: yup.mixed().test('definition-types', 'Definition is required', (value) => {
    if (Array.isArray(value)) {
      return value.length >= 1 && value[0].length >= 1;
    }
    if (typeof value === 'string') {
      return value.length >= 1;
    }
    return false;
  }),
  variations: yup.array().min(0).of(yup.string()),
  dialects: yup.object().shape({
    dialect: yup.string().optional(),
    variations: yup.array().min(0).of(yup.string()).optional(),
    pronunciation: yup.array().min(0).of(yup.string()).optional(),
  }),
  tenses: yup.object().shape(Object.values(Tense).reduce((finalSchema, tenseValue) => ({
    ...finalSchema,
    [tenseValue.value]: yup.string().optional(),
  }), {})).optional(),
  stems: yup.array().min(0).of(yup.string()),
  relatedTerms: yup.array().min(0).of(yup.string()),
  pronunciation: yup.array().min(0).of(yup.string()).optional(),
  examples: yup.array().min(0).of(ExampleEditFormSchema),
  nsibidi: yup.string(),
  twitterPollId: yup.string().optional(),
});

const resolver = (): any => ({
  resolver: yupResolver(schema),
});

export default resolver;
