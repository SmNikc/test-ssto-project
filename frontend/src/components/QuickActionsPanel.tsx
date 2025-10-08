import React from 'react';
import { Grid, Button } from '@mui/material';
import { useTrainingMode } from '../contexts/TrainingModeContext';
import { BackendService } from '../services/BackendService';

const QuickActionsPanel = () => {
  const { toggleTrainingMode } = useTrainingMode();

  const handleGenerateTest = async () => {
    try {
      await BackendService.generateTestSignal();
      console.info('Тестовый сигнал отправлен.');
    } catch (error) {
      console.error('Не удалось сгенерировать тестовый сигнал', error);
    }
  };

  const handleProcessEmail = async () => {
    try {
      await BackendService.processEmailQueue();
      console.info('Запущена обработка email очереди.');
    } catch (error) {
      console.error('Не удалось обработать email очередь', error);
    }
  };

  const handleSync = async () => {
    try {
      await BackendService.syncWithExternal();
      console.info('Синхронизация с внешними системами завершена.');
    } catch (error) {
      console.error('Синхронизация завершилась ошибкой', error);
    }
  };

  const handleSystemCheck = async () => {
    try {
      await BackendService.runSystemCheck();
      console.info('Проверка системы завершена.');
    } catch (error) {
      console.error('Проверка системы завершилась ошибкой', error);
    }
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