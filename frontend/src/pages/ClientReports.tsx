// frontend/src/pages/ClientReports.tsx
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const ClientReports = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Мои отчеты
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography>Отчетов пока нет</Typography>
      </Paper>
    </Box>
  );
};

export default ClientReports;