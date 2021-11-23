import React, { ReactElement } from 'react';
import { truncate } from 'lodash';
import {
  Box,
  IconButton,
  Text,
  chakra,
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';

const WordPill = ({
  word,
  wordClass,
  definitions,
  onDelete,
  index,
}: {
  word: string,
  wordClass: string,
  definitions: [string],
  onDelete: () => void;
  index: number,
}): ReactElement => (
  <>
    <Box display="flex" flexDirection="column" className="space-y-1">
      <Box display="flex" flexDirection="row" alignItems="center" className="space-x-2">
        <Text fontSize="sm" color="blue.500" fontWeight="bold">
          <chakra.span fontWeight="normal">
            {`${index + 1}. `}
          </chakra.span>
          {word}
        </Text>
        <Text fontSize="sm" fontStyle="italic" color="blue.400">{wordClass}</Text>
      </Box>
      <Text fontSize="sm" color="blue.400">
        {truncate(definitions[0])}
      </Text>
    </Box>
    <IconButton
      variant="ghost"
      color="red.400"
      aria-label="Delete"
      onClick={onDelete}
      _hover={{
        backgroundColor: 'transparent',
      }}
      _active={{
        backgroundColor: 'transparent',
      }}
      icon={<CloseIcon boxSize={4} />}
    />
  </>
);

export default WordPill;
