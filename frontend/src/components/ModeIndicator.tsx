import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTrainingMode } from '../contexts/TrainingModeContext';

const ModeIndicator = () => {
  const { isTrainingMode } = useTrainingMode();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '40px',
        backgroundColor: isTrainingMode ? '#ffeb3b' : '#4caf50',
        color: isTrainingMode ? '#000' : '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300
      }}
    >
      <Typography variant="h6">
        {isTrainingMode ? 'РЕЖИМ ТРЕНИРОВКИ' : 'РАБОЧИЙ РЕЖИМ'}
      </Typography>
    </Box>
  );
};

export default ModeIndicator;