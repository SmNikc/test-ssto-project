import { useForm, Controller } from 'react-hook-form';
import React from 'react';

import { TextField, Button, Stack } from '@mui/material';

type TestScenarioForm = {
  scenarioName: string;
  vesselName: string;
  startDate: string;
  endDate: string;
  notes: string;
};

export default function TestingForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TestScenarioForm>({
    defaultValues: {
      scenarioName: '',
      vesselName: '',
      startDate: '',
      endDate: '',
      notes: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: TestScenarioForm) => {
    // TODO: заменить на реальный вызов backend
    console.log('testing submit', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        <Controller
          name="scenarioName"
          control={control}
          rules={{ required: 'Название сценария обязательно' }}
          render={({ field, fieldState }: { field: any; fieldState: any }) => (
            <TextField
              {...field}
              label="Название сценария"
              error={!!fieldState.error}
              helperText={fieldState.error?.message || ''}
            />
          )}
        />

        <Controller
          name="vesselName"
          control={control}
          rules={{ required: 'Укажите судно' }}
          render={({ field, fieldState }: { field: any; fieldState: any }) => (
            <TextField
              {...field}
              label="Судно"
              error={!!fieldState.error}
              helperText={fieldState.error?.message || ''}
            />
          )}
        />

        <Controller
          name="startDate"
          control={control}
          rules={{ required: 'Укажите дату начала' }}
          render={({ field, fieldState }: { field: any; fieldState: any }) => (
            <TextField
              {...field}
              type="date"
              label="Начало"
              InputLabelProps={{ shrink: true }}
              error={!!fieldState.error}
              helperText={fieldState.error?.message || ''}
            />
          )}
        />

        <Controller
          name="endDate"
          control={control}
          rules={{ required: 'Укажите дату окончания' }}
          render={({ field, fieldState }: { field: any; fieldState: any }) => (
            <TextField
              {...field}
              type="date"
              label="Окончание"
              InputLabelProps={{ shrink: true }}
              error={!!fieldState.error}
              helperText={fieldState.error?.message || ''}
            />
          )}
        />

        <Controller
          name="notes"
          control={control}
          render={({ field }: { field: any }) => (
            <TextField {...field} label="Примечания" multiline minRows={3} />
          )}
        />

        <Button type="submit" variant="contained" disabled={isSubmitting}>
          Сохранить сценарий
        </Button>
      </Stack>
    </form>
  );
}
