CopyEdit
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { TextField, Button, Box, Grid, Typography } from '@mui/material';
import axios from 'axios';
import config from '../config';
interface RequestFormInputs {
  mmsi: string;
  vessel_name: string;
  ssas_number: string;
  owner_organization: string;
  contact_person: string;
  contact_phone: string;
  email: string;
  test_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}
const RequestForm: React.FC = () => {
  const { control, handleSubmit, reset } = useForm<RequestFormInputs>({
    defaultValues: {
      mmsi: '',
      vessel_name: '',
      ssas_number: '',
      owner_organization: '',
      contact_person: '',
      contact_phone: '',
      email: '',
      test_date: '',
      start_time: '',
      end_time: '',
      notes: '',
    },
  });
  const onSubmit = async (data: RequestFormInputs) => {
    try {
      await axios.post(`${config.API_BASE_URL}/api/requests`, data);
      alert('Заявка успешно отправлена!');
      reset();
    } catch (error) {
      alert('Ошибка при отправке заявки');
    }
  };
  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', p: 3 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Заявка на тестирование ССТО
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Controller
              name="mmsi"
              control={control}
              rules={{ required: 'MMSI обязателен' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="MMSI"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="vessel_name"
              control={control}
              rules={{ required: 'Название судна обязательно' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Название судна"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="ssas_number"
              control={control}
              rules={{ required: 'Номер ССТО обязателен' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Номер ССТО"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="owner_organization"
              control={control}
              rules={{ required: 'Судовладелец обязателен' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Организация-судовладелец"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="contact_person"
              control={control}
              rules={{ required: 'Контактное лицо обязательно' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Контактное лицо"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="contact_phone"
              control={control}
              rules={{ required: 'Телефон обязателен' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Телефон"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="email"
              control={control}
              rules={{ required: 'Email обязателен' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Email"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="test_date"
              control={control}
              rules={{ required: 'Дата теста обязательна' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Дата теста"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="start_time"
              control={control}
              rules={{ required: 'Время начала обязательно' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Начало (HH:MM)"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="end_time"
              control={control}
              rules={{ required: 'Время окончания обязательно' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Окончание (HH:MM)"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Примечания"
                  fullWidth
                  multiline
                  rows={2}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            <Button type="submit" variant="contained" color="primary">
              Отправить заявку
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
export default RequestForm;
