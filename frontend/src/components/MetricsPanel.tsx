import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';

interface MetricsPanelProps {
  activeSignals: number;
  emergencySignals: number;
  pendingRequests: number;
  todayTests: number;
}

const MetricsPanel = ({ activeSignals, emergencySignals, pendingRequests, todayTests }: MetricsPanelProps) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={3}>
        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
          <Typography variant="h4">{activeSignals}</Typography>
          <Typography>Активных сигналов</Typography>
        </Paper>
      </Grid>
      <Grid item xs={3}>
        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: emergencySignals > 0 ? '#ffcccc' : '#e8f5e9' }}>
          <Typography variant="h4" color={emergencySignals > 0 ? 'error' : 'inherit'}>
            {emergencySignals}
          </Typography>
          <Typography>Экстренных сигналов</Typography>
        </Paper>
      </Grid>
      <Grid item xs={3}>
        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#fff3e0' }}>
          <Typography variant="h4">{pendingRequests}</Typography>
          <Typography>Заявок в обработке</Typography>
        </Paper>
      </Grid>
      <Grid item xs={3}>
        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f3e5f5' }}>
          <Typography variant="h4">{todayTests}</Typography>
          <Typography>Тестов сегодня</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default MetricsPanel;