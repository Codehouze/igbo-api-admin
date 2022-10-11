import React, { ReactElement, useState, useEffect } from 'react';
import {
  assign,
  compact,
  map,
  omit,
  pick,
} from 'lodash';
import {
  Box,
  Button,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import { Record, useNotify, useRedirect } from 'react-admin';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
import ExampleStyle from 'src/backend/shared/constants/ExampleStyle';
import { EditFormProps } from 'src/shared/interfaces';
import { getExample } from 'src/shared/API';
import View from 'src/shared/constants/Views';
import useBeforeWindowUnload from 'src/hooks/useBeforeWindowUnload';
import useCacheForm from 'src/hooks/useCacheForm';
import { Textarea, Input } from 'src/shared/primitives';
import { handleUpdateDocument } from 'src/shared/constants/actionsMap';
import ExampleEditFormResolver from './ExampleEditFormResolver';
import { onCancel, sanitizeArray } from '../utils';
import FormHeader from '../FormHeader';
import AssociatedWordsForm from './components/AssociatedWordsForm';
import AudioRecorders from '../AudioRecorders';

const ExampleEditForm = ({
  view,
  record,
  save,
  resource = '',
  history,
  isPreExistingSuggestion,
}: EditFormProps) : ReactElement => {
  const style = pick(Object.values(ExampleStyle).find(({ value }) => value === record.style), ['value', 'label']);
  const {
    handleSubmit,
    getValues,
    setValue,
    control,
    errors,
    watch,
  } = useForm({
    defaultValues: {
      ...record,
      style,
      pronunciation: Array.isArray(record.pronunciation) ? record.pronunciation : compact([record.pronunciation]),
    },
    ...ExampleEditFormResolver,
  });
  const [originalRecord, setOriginalRecord] = useState(null);
  const [pronunciations, setPronunciations] = useState(
    Array.isArray(record.pronunciation) ? record.pronunciation : [record.pronunciation]
  );
  const [associatedWords, setAssociatedWords] = useState(
    record?.associatedWords?.length ? record.associatedWords : [''],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const notify = useNotify();
  const redirect = useRedirect();
  const toast = useToast();
  const options = Object.values(ExampleStyle).map(({ value, label }) => ({ value, label }));
  const watchPronunciations = watch('pronunciation');

  useEffect(() => {
    if (isPreExistingSuggestion) {
      toast({
        title: 'Pre-existing Example Suggestion',
        description: "We've redirected you to a pre-existing example suggestion, to avoid suggestion duplication.",
        status: 'info',
        duration: 9000,
        isClosable: true,
      });
    }
    (async () => {
      if (record.originalExampleId) {
        setOriginalRecord(await getExample(record.originalExampleId));
      }
    })();
  }, []);

  /* Grabs the user form data that will be cached */
  const createCacheExampleData = (data: any, record: Record = { id: null }) => {
    const cleanedData = {
      ...record,
      ...data,
      style: data.style.value,
      associatedWords: sanitizeArray(data.associatedWords),
    };
    return cleanedData;
  };

  /* Combines the approvals, denials, and cached form data to
   * send to the backend
   */
  const onSubmit = (data) => {
    setIsSubmitting(true);
    const cleanedData = omit(assign(
      {
        ...record,
        ...data,
        style: data.style.value,
      },
      createCacheExampleData(data, record),
      {
        approvals: map(record.approvals, (approval) => approval.uid),
        denials: map(record.denials, (denial) => denial.uid),
      },
    ), [view === View.CREATE ? 'id' : '']);
    localStorage.removeItem('igbo-api-admin-form');
    save(cleanedData, View.SHOW, {
      onSuccess: ({ data }) => {
        setIsSubmitting(false);
        handleUpdateDocument({ resource, record: data });
        notify(`Document successfully ${view === View.CREATE ? 'created' : 'updated'}`, 'info');
        redirect(View.SHOW, '/exampleSuggestions', data.id || record.id, { ...data, id: data.id || record.id });
      },
      onFailure: (error: any) => {
        const { body } = error;
        toast({
          title: 'Error',
          description: body?.error || error,
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
        setIsSubmitting(false);
      },
    });
  };

  /* Caches the form data with browser cookies */
  const cacheForm = () => {
    const data = getValues();
    const cleanedData = createCacheExampleData(data, record);
    localStorage.setItem('igbo-api-admin-form', JSON.stringify(cleanedData));
  };

  useBeforeWindowUnload();
  useCacheForm({ record, setValue, cacheForm });

  return (
    <form onChange={cacheForm} onSubmit={handleSubmit(onSubmit)}>
      <Box className="flex flex-col">
        {record.originalExampleId || (view === View.CREATE && record.id) ? (
          <>
            <h2 className="form-header">Origin Example Id:</h2>
            <Input
              className="form-input"
              data-test="original-id"
              value={record.originalExampleId || record.id}
              isDisabled
            />
          </>
        ) : null }
        <Box
          className="w-full flex flex-col lg:flex-row justify-between
          items-center space-y-4 lg:space-y-0 lg:space-x-6"
        >
          <Box className="flex flex-col w-full">
            <FormHeader
              title="Sentence Style"
              tooltip="Select the style or figure of speech that this sentence is using."
            />
            <Box data-test="sentence-style-input-container">
              <Controller
                render={({ onChange, ...rest }) => (
                  <Select
                    {...rest}
                    onChange={(e) => {
                      onChange(e);
                      cacheForm();
                    }}
                    options={options}
                  />
                )}
                name="style"
                control={control}
                defaultValue={style}
              />
            </Box>
            {errors.style ? (
              <p className="error">{errors.style.message}</p>
            ) : null}
          </Box>
          <AudioRecorders
            path="headword"
            getValues={getValues}
            setValue={setValue}
            pronunciations={pronunciations}
            setPronunciations={setPronunciations}
            record={record}
            control={control}
            originalRecord={originalRecord}
            name="pronunciation[index]"
            formTitle="Igbo Sentence Recording"
            formTooltip="Record the audio for the Igbo example sentence only one time.
            You are able to record over pre-existing recordings."
          />
        </Box>
        <FormHeader
          title="Igbo"
          tooltip="The example sentence in Standard Igbo"
        />
        <Controller
          render={(props) => (
            <Input
              {...props}
              className="form-input"
              placeholder="Biko"
              data-test="igbo-input"
            />
          )}
          name="igbo"
          control={control}
          defaultValue={record.igbo || getValues().igbo}
        />
        {errors.igbo ? (
          <p className="error">Igbo is required</p>
        ) : null}
      </Box>
      <Box className="flex flex-col">
        <FormHeader
          title="English"
          tooltip="The example sentence in English. This is the the literal English translation of the Igbo sentence."
        />
        <Controller
          render={(props) => (
            <Input
              {...props}
              className="form-input"
              placeholder="Please"
              data-test="english-input"
            />
          )}
          name="english"
          control={control}
          defaultValue={record.english || getValues().english}
        />
        {errors.english ? (
          <p className="error">English is required</p>
        ) : null}
      </Box>
      <Box className="flex flex-col">
        <FormHeader
          title="Meaning"
          tooltip="This field is for sentences that use figure of speech or where its literal translation isn't clear."
        />
        <Controller
          render={(props) => (
            <Input
              {...props}
              className="form-input"
              placeholder="Asking politely"
              data-test="meaning-input"
            />
          )}
          name="meaning"
          control={control}
          defaultValue={record.meaning || getValues().meaning}
        />
        {errors.meaning ? (
          <p className="error">{errors.meaning.message}</p>
        ) : null}
      </Box>
      <Box className="mt-2">
        <AssociatedWordsForm
          errors={errors}
          associatedWords={associatedWords}
          setAssociatedWords={setAssociatedWords}
          control={control}
          setValue={setValue}
          record={record}
        />
      </Box>
      <Box className="flex flex-col">
        <FormHeader
          title="Editor's Comments"
          tooltip={`Leave a comment for other editors to read to 
          understand your reasoning behind your change. 
          Leave your name on your comment!`}
        />
        <Controller
          render={(props) => (
            <Textarea
              {...props}
              className="form-textarea"
              placeholder="Comments"
              rows={8}
              defaultValue={record.userComments}
            />
          )}
          name="userComments"
          defaultValue={record.userComments}
          control={control}
        />
      </Box>
      <Box className="flex flex-row items-center form-buttons-container space-y-4 lg:space-y-0 lg:space-x-4">
        <Button
          className="mt-3 lg:my-0"
          backgroundColor="gray.300"
          onClick={() => onCancel({ view, resource, history })}
          disabled={isSubmitting}
          width="full"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          colorScheme="green"
          variant="solid"
          className="m-0"
          isLoading={isSubmitting}
          loadingText={view === View.CREATE ? 'Submitting' : 'Updating'}
          width="full"
        >
          {view === View.CREATE ? 'Submit' : 'Update'}
        </Button>
      </Box>
    </form>
  );
};

export default ExampleEditForm;
