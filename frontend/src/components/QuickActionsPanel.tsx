import React from 'react';
import { Grid, Button } from '@mui/material';
import { useTrainingMode } from '../contexts/TrainingModeContext';
import BackendService from '../services/BackendService';

const QuickActionsPanel = () => {
  const { toggleTrainingMode } = useTrainingMode();

  const handleGenerateTest = () => {
    BackendService.generateTestSignal();
  };

  const handleProcessEmail = () => {
    BackendService.processEmailQueue();
  };

  const handleSync = () => {
    BackendService.syncWithExternal();
  };

  const handleSystemCheck = () => {
    BackendService.runSystemCheck();
  };

  return (
    <Grid container spacing={2} sx={{ mt: 2 }}>
      <Grid item xs={3}>
        <Button variant="contained" color="primary" fullWidth onClick={handleProcessEmail}>
          📧 Обработать email очередь
        </Button>
      </Grid>
      <Grid item xs={3}>
        <Button variant="contained" color="primary" fullWidth onClick={handleSync}>
          🔄 Синхронизация с Поиск-Море
        </Button>
      </Grid>
      <Grid item xs={3}>
        <Button variant="contained" color="primary" fullWidth onClick={handleGenerateTest}>
          🎲 Генерировать тестовые данные
        </Button>
      </Grid>
      <Grid item xs={3}>
        <Button variant="contained" color="primary" fullWidth onClick={handleSystemCheck}>
          🔍 Проверка системы
        </Button>
      </Grid>
      <Grid item xs={12}>
        <Button variant="outlined" color="secondary" fullWidth onClick={toggleTrainingMode}>
          🔄 Переключить режим тренировки
        </Button>
      </Grid>
    </Grid>
  );
};

export default QuickActionsPanel;