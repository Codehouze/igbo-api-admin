import React, { ReactElement } from 'react';
import { Box, Button, IconButton } from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { Controller } from 'react-hook-form';
import { Input } from 'src/shared/primitives';
import FormHeader from '../../../FormHeader';
import VariationsFormInterface from './VariationsFormInterface';

const VariationsForm = (
  { variations, setVariations, control }: VariationsFormInterface,
): ReactElement => (
  <Box className="w-full bg-gray-200 rounded-lg p-2 mb-2 " height="fit-content">
    <Box className="flex items-center my-5 w-full justify-between">
      <FormHeader
        title="Spelling Variations"
        tooltip={`Unlike dialects, spelling variations capture the
        variations in spelling within Standard Igbo.`}
      />
      <Button
        colorScheme="green"
        aria-label="Add Variation"
        onClick={() => setVariations([...variations, ''])}
        leftIcon={<AddIcon />}
      >
        Add Variation
      </Button>
    </Box>
    {variations.length ? variations.map((variation, index) => (
      <Box className="list-container" key={variation}>
        <Controller
          render={(props) => (
            <Input {...props} />
          )}
          name={`variations[${index}]`}
          control={control}
          defaultValue={variations[index]}
        />
        <IconButton
          colorScheme="red"
          aria-label="Delete Variation"
          icon={<DeleteIcon />}
          onClick={() => {
            const filteredVariations = [...variations];
            filteredVariations.splice(index, 1);
            setVariations(filteredVariations);
          }}
          className="ml-3"
        />
      </Box>
    )) : (
      <Box className="flex w-full justify-center">
        <p className="text-gray-600 mb-4 italic">No spelling variations</p>
      </Box>
    )}
  </Box>
);
export default VariationsForm;
