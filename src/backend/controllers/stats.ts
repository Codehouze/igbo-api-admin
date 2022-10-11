import { Request, Response, NextFunction } from 'express';
import { compact } from 'lodash';
import moment from 'moment';
import Example from '../models/Example';
import Word from '../models/Word';
import WordSuggestion from '../models/WordSuggestion';
import ExampleSuggestion from '../models/ExampleSuggestion';
import Stat from '../models/Stat';
import {
  searchForAllWordsWithAudioPronunciations,
  searchForAllWordsWithIsStandardIgbo,
  searchForAllWordsWithNsibidi,
} from './utils/queries';
import { findWordsWithMatch } from './utils/buildDocs';
import determineDocumentCompleteness from './utils/determineDocumentCompleteness';
import determineExampleCompleteness from './utils/determineExampleCompleteness';
import determineIsAsCompleteAsPossible from './utils/determineIsAsCompleteAsPossible';
import StatTypes from '../shared/constants/StatTypes';

const findStat = async ({ statType, authorId = 'SYSTEM' }) => {
  let stat = await Stat.findOne({ type: statType, authorId });
  if (!stat) {
    // The stat hasn't been created, let's create a new one
    const newState = new Stat({ type: statType, authorId });
    stat = newState.save();
  }
  return stat;
};

const updateStat = async ({ statType, authorId = 'SYSTEM', value }) => {
  if ((!value && typeof value !== 'number')) {
    throw new Error('Valid truthy valid must be provided');
  }

  const stat = await findStat({ statType, authorId });
  stat.value = value;
  stat.markModified('value');
  return stat.save();
};

/* Returns all the WordSuggestions with Headword audio pronunciations */
const calculateTotalHeadwordsWithAudioPronunciations = async ():
Promise<{ audioPronunciationWords: number } | void> => {
  const audioPronunciationWords = await Word
    .countDocuments(searchForAllWordsWithAudioPronunciations());
  await updateStat({ statType: StatTypes.HEADWORD_AUDIO_PRONUNCIATIONS, value: audioPronunciationWords });
  return { audioPronunciationWords };
};

/* Returns all the Words that's in Standard Igbo */
const calculateTotalWordsInStandardIgbo = async (): Promise<{ isStandardIgboWords: number } | void> => {
  const isStandardIgboWords = await Word
    .countDocuments(searchForAllWordsWithIsStandardIgbo());
  await updateStat({ statType: StatTypes.STANDARD_IGBO, value: isStandardIgboWords });
  return { isStandardIgboWords };
};

/* Returns all Words with Nsịbịdị */
const calculateTotalWordsWithNsibidi = async () : Promise<{ wordsWithNsibidi: number } | void> => {
  const wordsWithNsibidi = await Word
    .countDocuments(searchForAllWordsWithNsibidi());
  await updateStat({ statType: StatTypes.NSIBIDI_WORDS, value: wordsWithNsibidi });

  return { wordsWithNsibidi };
};

/* Returns all Word Suggestions with Nsịbịdị */
const calculateTotalWordSuggestionsWithNsibidi = async () : Promise<{ wordSuggestionsWithNsibidi: number } | void> => {
  const wordSuggestionsWithNsibidi = await WordSuggestion
    .countDocuments({ ...searchForAllWordsWithNsibidi(), merged: null });
  await updateStat({ statType: StatTypes.NSIBIDI_WORD_SUGGESTIONS, value: wordSuggestionsWithNsibidi });
  return { wordSuggestionsWithNsibidi };
};

const countWords = async (words) => {
  let sufficientWordsCount = 0;
  let completeWordsCount = 0;
  let dialectalVariationsCount = 0;
  await Promise.all(words.map(async (word) => {
    const isAsCompleteAsPossible = determineIsAsCompleteAsPossible(word);
    const { sufficientWordRequirements, completeWordRequirements } = await determineDocumentCompleteness(word, true);
    // Tracks total sufficient words
    const isSufficientWord = !sufficientWordRequirements.length;
    if (isSufficientWord) {
      sufficientWordsCount += 1;
    }
    // Tracks total complete words
    const isCompleteWord = isAsCompleteAsPossible || !completeWordRequirements.length || (
      completeWordRequirements.length === 1
      && completeWordRequirements.includes('The headword is needed')
    );
    if (isCompleteWord) {
      completeWordsCount += 1;
    }
    // Tracks total dialectal variations
    dialectalVariationsCount += (Object.keys(word.dialects || {}).length + 1);
  }));

  return { sufficientWordsCount, completeWordsCount, dialectalVariationsCount };
};

/* Returns all the Words that are "sufficient" */
const calculateWordStats = async ():
Promise<{ sufficientWordsCount: number, completeWordsCount: number, dialectalVariationsCount: number } | void> => {
  const INCLUDE_ALL_WORDS_LIMIT = 100000;
  const words = await findWordsWithMatch({
    match: {
      word: { $regex: /./ },
      'attributes.isStandardIgbo': { $eq: true },
      'attributes.isAccented': { $eq: true },
    },
    examples: true,
    limit: INCLUDE_ALL_WORDS_LIMIT,
  });
  const { sufficientWordsCount, completeWordsCount, dialectalVariationsCount } = await countWords(words);
  await updateStat({ statType: StatTypes.SUFFICIENT_WORDS, value: sufficientWordsCount });
  await updateStat({ statType: StatTypes.COMPLETE_WORDS, value: completeWordsCount });
  await updateStat({ statType: StatTypes.DIALECTAL_VARIATONS, value: dialectalVariationsCount });

  return { sufficientWordsCount, completeWordsCount, dialectalVariationsCount };
};

const countCompletedExamples = async (examples) => {
  const sufficientExamplesCount = compact(await Promise.all(examples.map(async (example) => (
    !(await determineExampleCompleteness(example)).completeExampleRequirements.length)))).length;
  return sufficientExamplesCount;
};

/* Returns all the Examples that are on the platform */
const calculateExampleStats = async ():
Promise<{ sufficientExamplesCount: number, completedExamplesCount: number } | void> => {
  const examples = await Example
    .find({
      $and: [
        { $expr: { $gt: [{ $strLenCP: '$igbo' }, 3] } },
        { $expr: { $gte: ['$english', '$igbo'] } },
        { 'associatedWords.0': { $exists: true } },
      ],
    });
  const sufficientExamplesCount = examples.length;
  await updateStat({ statType: StatTypes.SUFFICIENT_EXAMPLES, value: sufficientExamplesCount });

  const completedExamplesCount = await countCompletedExamples(examples);
  await updateStat({ statType: StatTypes.COMPLETE_EXAMPLES, value: completedExamplesCount });

  return { sufficientExamplesCount, completedExamplesCount };
};

export const getUserStats = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { user, params: { uid } } = req;
    const userId = uid || user.uid;
    const wordSuggestions = await WordSuggestion.find({}).lean();
    const exampleSuggestions = await ExampleSuggestion.find({}).lean();

    const approvedWordSuggestionsCount = wordSuggestions.filter(({ approvals }) => approvals.includes(userId)).length;
    const deniedWordSuggestionsCount = wordSuggestions.filter(({ denials }) => denials.includes(userId)).length;
    const approvedExampleSuggestionsCount = exampleSuggestions
      .filter(({ approvals }) => approvals.includes(userId)).length;
    const deniedExampleSuggestionsCount = exampleSuggestions.filter(({ denials }) => denials.includes(userId)).length;
    const authoredWordSuggestionsCount = wordSuggestions.filter(({ author }) => author === userId).length;
    const authoredExampleSuggestionsCount = exampleSuggestions.filter(({ author }) => author === userId).length;
    const mergedWordSuggestionsCount = wordSuggestions.filter(({ mergedBy }) => mergedBy === userId).length;
    const mergedExampleSuggestionsCount = exampleSuggestions.filter(({ mergedBy }) => mergedBy === userId).length;
    const currentEditingWordSuggestionsCount = wordSuggestions.filter(({ mergedBy, userInteractions = [] }) => (
      !mergedBy && userInteractions.includes(userId)
    )).length;
    const currentEditingExampleSuggestionsCount = exampleSuggestions.filter(({ mergedBy, userInteractions = [] }) => (
      !mergedBy && userInteractions.includes(userId)
    )).length;

    return res.send({
      approvedWordSuggestionsCount,
      deniedWordSuggestionsCount,
      approvedExampleSuggestionsCount,
      deniedExampleSuggestionsCount,
      authoredWordSuggestionsCount,
      authoredExampleSuggestionsCount,
      mergedWordSuggestionsCount,
      mergedExampleSuggestionsCount,
      currentEditingWordSuggestionsCount,
      currentEditingExampleSuggestionsCount,
    });
  } catch (err) {
    return next(err);
  }
};

export const getUserMergeStats = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { params: { uid } } = req;
    const userId = uid;
    const threeMonthsAgo = moment().subtract(3, 'months').toDate();
    const wordSuggestions = await WordSuggestion.find(
      {
        mergedBy: userId,
        updatedAt: { $gte: threeMonthsAgo },
      },
      null,
      { sort: { updatedAt: 1 } },
    );
    const exampleSuggestions = await ExampleSuggestion.find(
      {
        mergedBy: userId,
        updatedAt: { $gte: threeMonthsAgo },
      },
      null,
      { sort: { updatedAt: 1 } },
    );
    const wordSuggestionMerges = wordSuggestions.reduce((finalData, wordSuggestion) => {
      const isoWeek = moment(wordSuggestion.updatedAt).isoWeek();
      if (!finalData[isoWeek]) {
        finalData[isoWeek] = [];
      }
      return {
        ...finalData,
        [isoWeek]: finalData[isoWeek].concat(wordSuggestion),
      };
    }, {});
    const exampleSuggestionMerges = exampleSuggestions.reduce((finalData, exampleSuggestion) => {
      const isoWeek = moment(exampleSuggestion.updatedAt).isoWeek();
      if (!finalData[isoWeek]) {
        finalData[isoWeek] = [];
      }
      return {
        ...finalData,
        [isoWeek]: finalData[isoWeek].concat(exampleSuggestion),
      };
    }, {});
    return res.send({ wordSuggestionMerges, exampleSuggestionMerges });
  } catch (err) {
    return next(err);
  }
};

export const getStats = async (_: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const stats = await Stat.find({ type: { $in: Object.values(StatTypes) } });
    return res.send(stats.reduce((finalObject, stat) => ({
      ...finalObject,
      [stat.type]: stat,
    }), {}));
  } catch (err) {
    return next(err);
  }
};

export const onUpdateDashboardStats = async (): Promise<void> => {
  await calculateExampleStats();
  await calculateTotalWordSuggestionsWithNsibidi();
  await calculateTotalWordsWithNsibidi();
  await calculateTotalWordsInStandardIgbo();
  await calculateTotalHeadwordsWithAudioPronunciations();
  await calculateWordStats();
};
