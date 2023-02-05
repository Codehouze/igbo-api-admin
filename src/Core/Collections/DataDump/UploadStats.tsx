import React, { ReactElement } from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Text,
  Tooltip,
  chakra,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon } from '@chakra-ui/icons';
import type StatusType from './StatusType';

const UploadStatus = ({
  statuses,
  index,
} : {
  statuses: StatusType[],
  index: number
}): ReactElement => (
  <Box>
    <Text fontSize="lg" fontWeight="bold">{`Batch #${index + 1}`}</Text>
    <Accordion allowMultiple className="w-full my-6">
      <AccordionItem>
        <Tooltip label="Result statues statuses from the bulk upload.">
          <AccordionButton>
            <Box className="w-full flex flex-row items-center">
              <Text fontWeight="bold">{`Chunk #${index + 1} Details`}</Text>
              <AccordionIcon />
            </Box>
          </AccordionButton>
        </Tooltip>
        <AccordionPanel>
          {statuses.map(({ success, message, meta }) => {
            const StatusIcon = success ? CheckIcon : CloseIcon;
            return (
              <Box>
                <Text color={success ? 'green' : 'red'} fontWeight="bold">
                  <chakra.span mr={3}>
                    <StatusIcon color={success ? 'green' : 'red'} boxSize={4} />
                  </chakra.span>
                  {success ? 'Succeeded' : 'Failed'}
                </Text>
                {message ? (
                  <Text fontWeight="bold" fontSize="sm">
                    {'Error message: '}
                    <chakra.span fontWeight="normal">
                      {message}
                    </chakra.span>
                  </Text>
                ) : null}
                <Text fontWeight="bold" fontSize="sm">
                  {'Sentence: '}
                  <chakra.span fontWeight="normal">{meta.igbo}</chakra.span>
                </Text>
                {meta.id ? (
                  <Text fontWeight="bold" fontSize="sm">
                    {'Sentence Id: '}
                    <chakra.span fontWeight="normal">{meta.id}</chakra.span>
                  </Text>
                ) : null}
              </Box>
            );
          })}
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  </Box>
);

export default UploadStatus;
