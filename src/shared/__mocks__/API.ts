export const getWord = jest.fn(async () => ({
  word: 'retrieved word',
  id: '234',
  definitions: [{
    wordClass: 'NNC',
    definitions: ['first definition'],
  }],
}));

export const getWords = jest.fn(async () => ([
  {
    word: 'retrieved word',
    id: '234',
    definitions: [{
      wordClass: 'NNC',
      definitions: ['first definition'],
    }],
  },
]));

export const getNsibidiCharacter = jest.fn(async () => ({
  nsibidi: 'nsibidi',
  definitions: [{ text: 'first definition' }],
  pronunciations: [{ text: 'first pronunciation' }],
}));

export const getNsibidiCharacters = jest.fn(async () => ([{
  nsibidi: 'nsibidi',
  definitions: [{ text: 'first definition' }],
  pronunciations: [{ text: 'first pronunciation' }],
}]));

export const getWordSuggestions = jest.fn(async () => ([]));

export const resolveWord = jest.fn(async () => ({
  word: 'resolved word',
  id: '567',
  definitions: [{
    wordClass: 'ADJ',
    definitions: ['resolved word definition'],
  }],
}));

export const getExample = jest.fn(async () => ({
  igbo: 'igbo',
  english: 'english',
  meaning: '',
  nsibidi: '',
  associatedWords: [],
  associatedDefinitionsSchemas: [],
}));
