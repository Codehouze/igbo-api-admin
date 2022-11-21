import { v4 as uuidv4 } from 'uuid';
// import mongoose from 'mongoose';
import {
  DocumentSelectOptions,
  SuggestionSelectOptions,
  WordClassOptions,
  DialectOptions,
} from '../../constants';

const errorMessage = 'An error occurred while saving';
describe.skip('Create', () => {
  beforeEach(() => {
    cy.cleanLogin();
  });

  describe('Word Suggestions', () => {
    it('render the custom create view for wordSuggestions', () => {
      cy.selectCollection('words');
      cy.getActionsOption(DocumentSelectOptions.SUGGEST_NEW_EDIT).click();
      cy.findByTestId('word-input');
      cy.findByTestId('word-class-input-container');
      cy.get('[data-test*="definitions-"]');
    });

    it('show the newly created wordSuggestions', () => {
      const word = 'new word';
      cy.selectCollection('words');
      cy.getActionsOption(DocumentSelectOptions.VIEW).click();
      cy.findByText('Suggest an Edit').click();
      cy.findByTestId('word-input').type(word);
      cy.findByTestId('definitions-0-input').type('first definition');
      cy.findByTestId('word-class-input-container').click();
      cy.findByText(WordClassOptions.PRN.label).click();  
      cy.get('[aria-label="Add Example"]').click({ force: true });
      cy.findByTestId('examples-0-igbo-input').type('igbo example');
      cy.findByTestId('examples-0-english-input').type('english example');
      cy.get('div.list-container')
        .last()
        .find('button')
        .contains('Delete')
        .click();
      cy.get('button[type="submit"]').click();
      cy.contains('Word Suggestion Document Details');
      cy.contains('Document Author');
      cy.contains('N/A');
    });

    it('stop from submitting an incomplete wordSuggestion', () => {
      cy.selectCollection('wordSuggestions');
      cy.get('button').contains('Create').click();
      cy.findByTestId('word-class-input-container').click();
      cy.findByText('Part of Speech').click();
      cy.findByTestId('definitions-0-input').clear();
      cy.get('button[type="submit"]').click();
      cy.findByText('Word is required');
      cy.findByText('Part of speech is required');
      cy.findByText('Definition is required');
    });

    it('create a new wordSuggestion and update with part of speech', () => {
      const word = 'new word';
      const definition = 'first definition';
      cy.get('a[href="#/wordSuggestions').click();
      cy.get('button').contains('Create').click();
      cy.findByTestId('word-input').type(word);
      cy.findByTestId('word-class-input-container').click();
      cy.findByText(WordClassOptions.PRN.label).click();
      cy.findByTestId('definitions-0-input').type(definition);
      cy.get('button[type="submit"]').click();
      cy.findAllByText(word);
      cy.findByText('Pronoun');
      cy.findByText(definition);
      cy.getActionsOption(SuggestionSelectOptions.EDIT).click();
      cy.findByTestId('word-class-input-container').click();
      cy.findByText(WordClassOptions.ADV.label).click();
      cy.get('button[type="submit"]').click();
      cy.findAllByText(word);
      cy.findByText(WordClassOptions.ADV.label);
      cy.findByText(definition);
    });

    it('create a new wordSuggestion and merge with dialect', () => {
      const word = uuidv4();
      const definition = 'first definition';
      cy.intercept('POST', '**/words').as('mergeWord');
      cy.get('a[href="#/wordSuggestions"]').click();
      cy.get('button').contains('Create').click();
      cy.findByTestId('word-input').type(word);
      cy.findByTestId('word-class-input-container').click();
      cy.findByText(WordClassOptions.PRN.label).click();
      cy.findByTestId('definitions-0-input').type(definition);
      cy.findByTestId('dialects-NSA-word-input').clear().type('NSA word dialect');
      cy.findByTestId('dialects-OGU-word-input').clear().type('OGU word dialect');
      cy.get('button[type="submit"]').click();
      cy.getActionsOption(SuggestionSelectOptions.MERGE).click();
      cy.acceptConfirmation();
      cy.contains('Word Document Details');
      cy.selectCollection('words');
      cy.wait(2000);
      cy.searchForDocument(word);
      // Clicking on results table to make sure the Editors Actions' dropdown is attached to the DOM
      cy.get('table').click().then(() => {
        cy.getActionsOption(DocumentSelectOptions.VIEW).click();
        cy.findByText('NSA word dialect');
        cy.findByText(DialectOptions.OGU.label).click();
        cy.findByText('OGU word dialect');
        cy.contains('Suggest an Edit').click();
        cy.findByTestId('dialects-NSA-word-input').should('have.value', 'NSA word dialect');
        cy.findByTestId('dialects-OGU-word-input').should('have.value', 'OGU word dialect');
      });
    });

    it('create a new word suggestion with nested exampleSuggestions', () => {
      const word = uuidv4();
      const definition = 'first definition';
      const firstIgboSentence = 'first igbo sentence';
      const secondIgboSentence = 'second igbo sentence';
      const firstEnglishSentence = 'first english sentence';
      const secondEnglishSentence = 'second english sentence';
      cy.intercept('POST', '**/words').as('mergeWord');
      cy.get('a[href="#/wordSuggestions"]').click();
      cy.get('button').contains('Create').click();
      cy.findByTestId('word-input').type(word);
      cy.findByTestId('word-class-input-container').click();
      cy.findByText(WordClassOptions.PRN.label).click();
      cy.findByTestId('definitions-0-input').type(definition);
      cy.findByLabelText('Add Example').click();
      cy.findByTestId('examples-0-igbo-input').clear().type(firstIgboSentence);
      cy.findByTestId('examples-0-english-input').clear().type(firstEnglishSentence);
      cy.findByLabelText('Add Example').click();
      cy.findByTestId('examples-1-igbo-input').clear().type(secondIgboSentence);
      cy.findByTestId('examples-1-english-input').clear().type(secondEnglishSentence);
      cy.get('button[type="submit"]').click();
      cy.getActionsOption(SuggestionSelectOptions.MERGE).click();
      cy.acceptConfirmation();
      cy.contains('Word Document Details');
      cy.findByText(firstIgboSentence);
      cy.findByText(firstEnglishSentence);
      cy.findByText(secondIgboSentence);
      cy.findByText(secondEnglishSentence);
      cy.findByTestId('incomplete-word-label').should('be.visible');
    });

    it('create a new "complete" word suggestion', () => {
      const word = `${uuidv4()}á`;
      const definition = 'first definition';
      const firstIgboSentence = 'first igbo sentence';
      const secondIgboSentence = 'second igbo sentence';
      const firstEnglishSentence = 'first english sentence';
      const secondEnglishSentence = 'second english sentence';
      cy.intercept('POST', '**/words').as('mergeWord');
      cy.get('a[href="#/wordSuggestions"]').click();
      cy.get('button').contains('Create').click();
      cy.findByTestId('word-input').type(word);
      cy.findByTestId('isStandardIgbo-checkbox').click();
      cy.findByTestId('word-class-input-container').click();
      cy.findByText(WordClassOptions.PRN.label).click();
      cy.recordAudio();
      cy.findByTestId('definitions-0-input').type(definition);
      cy.findByLabelText('Add Example').click();
      cy.findByTestId('examples-0-igbo-input').clear().type(firstIgboSentence);
      cy.findByTestId('examples-0-english-input').clear().type(firstEnglishSentence);
      cy.findByLabelText('Add Example').click();
      cy.findByTestId('examples-1-igbo-input').clear().type(secondIgboSentence);
      cy.findByTestId('examples-1-english-input').clear().type(secondEnglishSentence);
      cy.get('button[type="submit"]').click();
      cy.getActionsOption(SuggestionSelectOptions.MERGE).click();
      cy.acceptConfirmation();
      cy.contains('Word Document Details');
      cy.findByTestId('complete-word-label').should('be.visible');
    });

    it('render an error notification for word form upon submitting', () => {
      cy.createWordSuggestion();
      const word = 'new word';
      cy.intercept('POST', '**/wordSuggestions', {
        statusCode: 400,
        body: { error: errorMessage },
      }).as('postWordSuggestionFailure');
      cy.selectCollection('wordSuggestions');
      cy.get('button').contains('Create').click();
      cy.findByTestId('word-input').type(word);
      cy.findByTestId('word-class-input-container').click();
      cy.findByText(WordClassOptions.CJN.label).click();
      cy.findByTestId('definitions-0-input').type('first definition');
      cy.get('button[type="submit"]').click();
      cy.wait('@postWordSuggestionFailure');
      cy.findByText(errorMessage);
    });
  });

  describe('Example Suggestions', () => {
    it('render the custom create view for exampleSuggestions', () => {
      cy.selectCollection('examples');
      cy.getActionsOption(DocumentSelectOptions.SUGGEST_NEW_EDIT).click();
      cy.findByTestId('igbo-input');
      cy.findByTestId('english-input');
      cy.get('[data-test*="associated-words-"]');
    });

    it('show the newly created exampleSuggestions', () => {
      cy.selectCollection('examples');
      cy.getActionsOption(DocumentSelectOptions.VIEW).click();
      cy.get('button').contains('Suggest an Edit').click();
      cy.findByTestId('igbo-input').type('igbo');
      cy.findByTestId('english-input').type('english');
      cy.get('button[type="submit"]').click();
      cy.contains('Example Suggestion Document Details');
    });

    it('doesn\'t submit form due to incomplete exampleSuggestion', () => {
      cy.selectCollection('examples');
      cy.getActionsOption(DocumentSelectOptions.SUGGEST_NEW_EDIT).click();
      cy.findByTestId('igbo-input').clear();
      cy.findByTestId('english-input').clear();
      cy.findByTestId('associated-words-0-input').clear();
      cy.intercept('POST', '**/api/v1/exampleSuggestions').as('failedExampleSuggestion');
      cy.get('button[type="submit"]').click();
      cy.get('button[type="submit"]');
    });

    it('link to the nested example', () => {
      const word = uuidv4();
      const igbo = 'igbo example';
      const english = 'english example';
      cy.selectCollection('wordSuggestions');
      cy.get('button').contains('Create').click();
      cy.findByTestId('word-input').type(word);
      cy.findByTestId('word-class-input-container').click();
      cy.findByText(WordClassOptions.CJN.label).click();
      cy.findByTestId('definitions-0-input').type('first definition');
      cy.get('[aria-label="Add Example"]').click({ force: true });
      cy.findByTestId('examples-0-igbo-input').type(igbo);
      cy.findByTestId('examples-0-english-input').type(english);
      cy.get('button[type="submit"]').click();
      cy.getActionsOption(SuggestionSelectOptions.MERGE).click();
      cy.acceptConfirmation();
      cy.contains('Word Document Details');
      cy.contains('Link to Example').then(([link]) => {
        link.click();
        cy.findByText(igbo);
        cy.findByText(english);
      });
    });

    it('render an error notification for example form upon submitting', () => {
      const associatedWordId = mongoose.Types.ObjectId().toString();
      cy.createExampleSuggestion();
      cy.intercept('POST', '**/exampleSuggestions', {
        statusCode: 400,
        body: { error: errorMessage },
      }).as('postExampleSuggestionFailure');
      cy.selectCollection('examples');
      cy.getActionsOption(DocumentSelectOptions.SUGGEST_NEW_EDIT).click();
      cy.findByTestId('igbo-input').type('igbo word');
      cy.findByTestId('english-input').type('english word');
      cy.findByTestId('associated-words-0-input').clear().type(associatedWordId);
      cy.get('button[type="submit"]').click();
      cy.wait('@postExampleSuggestionFailure');
      cy.findByText(errorMessage);
    });
  });
});
