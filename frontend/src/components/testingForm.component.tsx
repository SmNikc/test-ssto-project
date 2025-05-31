import config from '../config';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { TextField, Button, Select, MenuItem, Grid, Typography, Box } from '@mui/material';
import axios from 'axios';

interface TestingScenario {
  description: string;
  expected_result: string;
  actual_result?: string;
  status: 'planned' | 'completed' | 'failed';
  comments?: string;
}

const TestingForm: React.FC = () => {
  const { control, handleSubmit, reset } = useForm<TestingScenario>({
    defaultValues: {
      description: '',
      expected_result: '',
      actual_result: '',
      status: 'planned',
      comments: '',
    },
  });

  const onSubmit = async (data: TestingScenario) => {
    try {
      await axios.post('${config.API_BASE_URL}/api/testing/scenarios', data);
      alert('Сценарий успешно создан!');
      reset();
    } catch (error) {
      console.error('Ошибка создания сценария:', error);
      alert('Ошибка при создании сценария. Попробуйте снова.');
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Форма тестирования
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">Описание сценария</Typography>
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="description"
              control={control}
              rules={{ required: 'Описание обязательно' }}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="Описание"
                  fullWidth
                  multiline
                  rows={2}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="expected_result"
              control={control}
              rules={{ required: 'Ожидаемый результат обязателен' }}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="Ожидаемый результат"
                  fullWidth
                  multiline
                  rows={2}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="actual_result"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Фактический результат"
                  fullWidth
                  multiline
                  rows={2}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select {...field} fullWidth label="Статус">
                  <MenuItem value="planned">Запланирован</MenuItem>
                  <MenuItem value="completed">Выполнен</MenuItem>
                  <MenuItem value="failed">Провал</MenuItem>
                </Select>
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="comments"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Комментарии"
                  fullWidth
                  multiline
                  rows={2}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            <Button type="submit" variant="contained" color="primary">
              Создать сценарий
            </Button>
            <Button variant="outlined" onClick={() => reset()} sx={{ ml: 2 }}>
              Очистить
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default TestingForm;
