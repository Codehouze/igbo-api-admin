import React, { ReactElement, useEffect, useState } from 'react';
import { get } from 'lodash';
import {
  Box,
  Checkbox,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';
import { Controller } from 'react-hook-form';
import determineIsAsCompleteAsPossible from 'src/backend/controllers/utils/determineIsAsCompleteAsPossible';
import WordAttributes from 'src/backend/shared/constants/WordAttributes';
import { Input } from 'src/shared/primitives';
import generateFlags from 'src/shared/utils/flagHeadword';
import FormHeader from '../../../FormHeader';
import HeadwordInterface from './HeadwordFormInterface';
import SuggestedWords from './SuggestedWords';

const HeadwordForm = ({
  errors,
  control,
  record,
  getValues,
  watch,
  isConstructedTerm,
}: HeadwordInterface): ReactElement => {
  const [flags, setFlags] = useState({});
  const isHeadwordAccented = (record.word || '').normalize('NFD').match(/(?!\u0323)[\u0300-\u036f]/g);
  const isAsCompleteAsPossible = determineIsAsCompleteAsPossible(record);
  const watchedWord = watch('word');

  useEffect(() => {
    const { flags: generatedFlags } = generateFlags({ word: { ...(record || {}), word: watchedWord }, flags: {} });
    setFlags(generatedFlags);
  }, [watchedWord]);
  return (
    <Box className="flex flex-col w-full">
      <Box className="flex flex-col my-2 space-y-2 justify-between items-between">
        <FormHeader
          title="Headword"
          tooltip={`This is the headword that should ideally be in to Standard Igbo.
          Add diacritic marks to denote the tone for the word. 
          All necessary accented characters will appear in the letter popup`}
          color={Object.values(flags).length ? 'orange.600' : ''}
        />
        <Box
          className="w-full grid grid-flow-row grid-cols-2 gap-4 px-3"
        >
          <Controller
            render={({ onChange, value, ref }) => (
              <Checkbox
                onChange={(e) => onChange(e.target.checked)}
                isChecked={value}
                defaultIsChecked={record.attributes?.[WordAttributes.IS_STANDARD_IGBO.value]}
                ref={ref}
                data-test={`${WordAttributes.IS_STANDARD_IGBO.value}-checkbox`}
                size="lg"
              >
                <span className="font-bold">{WordAttributes.IS_STANDARD_IGBO.label}</span>
              </Checkbox>
            )}
            defaultValue={record.attributes?.[WordAttributes.IS_STANDARD_IGBO.value]
              || getValues().attributes?.[WordAttributes.IS_STANDARD_IGBO.value]}
            name={`attributes.${WordAttributes.IS_STANDARD_IGBO.value}`}
            control={control}
          />
          <Tooltip
            label={!isAsCompleteAsPossible ? 'Unable to mark as complete until all necessary fields are filled' : ''}
          >
            <Box display="flex">
              <Controller
                render={({ onChange, value, ref }) => (
                  <Checkbox
                    onChange={(e) => onChange(e.target.checked)}
                    isChecked={value}
                    defaultIsChecked={isHeadwordAccented?.length
                      || record.attributes?.[WordAttributes.IS_ACCENTED.value]}
                    ref={ref}
                    data-test={`${WordAttributes.IS_ACCENTED.value}-checkbox`}
                    size="lg"
                  >
                    <span className="font-bold">{WordAttributes.IS_ACCENTED.label}</span>
                  </Checkbox>
                )}
                defaultValue={isHeadwordAccented?.length
                  || record.attributes?.[WordAttributes.IS_ACCENTED.value]
                  || getValues().attributes?.[WordAttributes.IS_ACCENTED.value]}
                name={`attributes.${WordAttributes.IS_ACCENTED.value}`}
                control={control}
              />
            </Box>
          </Tooltip>
          {errors.attributes?.isAccented ? (
            <p className="error relative">Is Accented must be selected</p>
          ) : null}
          <Tooltip label="Check this checkbox if this word is considered casual slang">
            <Box display="flex">
              <Controller
                render={({ onChange, value, ref }) => (
                  <Checkbox
                    onChange={(e) => onChange(e.target.checked)}
                    isChecked={value}
                    defaultIsChecked={record.attributes?.[WordAttributes.IS_SLANG.value]}
                    ref={ref}
                    data-test={`${WordAttributes.IS_SLANG.label}-checkbox`}
                    size="lg"
                  >
                    <span className="font-bold">{WordAttributes.IS_SLANG.label}</span>
                  </Checkbox>
                )}
                defaultValue={record.attribute?.[WordAttributes.IS_SLANG.value]
                  || getValues().attributes?.[WordAttributes.IS_SLANG.value]}
                name={`attributes.${WordAttributes.IS_SLANG.value}`}
                control={control}
              />
            </Box>
          </Tooltip>
          <Tooltip label={isConstructedTerm
            ? 'This box is checked by default because this is a constructed term'
            : 'Check this checkbox if this is a newly coined, aka constructed, Igbo word'}
          >
            <Box display="flex">
              <Controller
                render={({ onChange, value, ref }) => (
                  <Checkbox
                    onChange={(e) => onChange(e.target.checked)}
                    isChecked={isConstructedTerm || value}
                    defaultIsChecked={record.attributes?.[WordAttributes.IS_CONSTRUCTED_TERM.value]}
                    ref={ref}
                    data-test={`${WordAttributes.IS_CONSTRUCTED_TERM.label}-checkbox`}
                    size="lg"
                  >
                    <span className="font-bold">{WordAttributes.IS_CONSTRUCTED_TERM.label}</span>
                  </Checkbox>
                )}
                defaultValue={record.attribute?.[WordAttributes.IS_CONSTRUCTED_TERM.value]
                  || getValues().attributes?.[WordAttributes.IS_CONSTRUCTED_TERM.value]}
                name={`attributes.${WordAttributes.IS_CONSTRUCTED_TERM.value}`}
                control={control}
              />
            </Box>
          </Tooltip>
          <Tooltip label="Check this checkbox if this word is borrowed from another language">
            <Box display="flex">
              <Controller
                render={({ onChange, value, ref }) => (
                  <Checkbox
                    onChange={(e) => onChange(e.target.checked)}
                    isChecked={value}
                    defaultIsChecked={record.attributes?.[WordAttributes.IS_BORROWED_TERM.value]}
                    ref={ref}
                    data-test={`${WordAttributes.IS_BORROWED_TERM.label}-checkbox`}
                    size="lg"
                  >
                    <span className="font-bold">{WordAttributes.IS_BORROWED_TERM.label}</span>
                  </Checkbox>
                )}
                defaultValue={record.attribute?.[WordAttributes.IS_BORROWED_TERM.value]
                  || getValues().attributes?.[WordAttributes.IS_BORROWED_TERM.value]}
                name={`attributes.${WordAttributes.IS_BORROWED_TERM.value}`}
                control={control}
              />
            </Box>
          </Tooltip>
        </Box>
      </Box>
      <Controller
        render={(props) => (
          <Input
            {...props}
            className="form-input"
            placeholder="i.e. biko, igwe, mmiri"
            data-test="word-input"
          />
        )}
        name="word"
        control={control}
        defaultValue={record.word || getValues().word}
      />
      {Object.values(flags).map((message: string) => (
        message ? (
          <Box key={message} className="flex flex-row items-start">
            <WarningIcon boxSize={3} mr={2} mt={2} color="orange.600" />
            <Text color="orange.600" fontSize="sm">{message}</Text>
          </Box>
        ) : null
      ))}
      <SuggestedWords word={watchedWord || ''} id={get(record, 'id')} />
      {errors.word && (
        <p className="error">Word is required</p>
      )}
    </Box>
  );
};

export default HeadwordForm;
