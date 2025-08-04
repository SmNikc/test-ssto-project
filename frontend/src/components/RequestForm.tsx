<<<<<<< HEAD
import config from '../config';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { TextField, Button, Grid, Typography, Box, CircularProgress } from '@mui/material';
import InputMask from 'react-input-mask';
import axios from 'axios';

interface FormData {
  mmsi: string;
  vesselName: string;
  ssasNumber: string;
  ownerOrganization: string;
  contactPerson: string;
  contactPhone: string;
  email: string;
  testDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

const RequestForm: React.FC = () => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      mmsi: '',
      vesselName: '',
      ssasNumber: '',
      ownerOrganization: '',
      contactPerson: '',
      contactPhone: '',
      email: '',
      testDate: '',
      startTime: '',
      endTime: '',
      notes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        mmsi: data.mmsi,
        vessel_name: data.vesselName,
        ssas_number: data.ssasNumber,
        owner_organization: data.ownerOrganization,
        contact_person: data.contactPerson,
        contact_phone: data.contactPhone,
        email: data.email,
        test_date: data.testDate,
        start_time: data.startTime,
        end_time: data.endTime,
        notes: data.notes || null,
      };

      await axios.post('${config.API_BASE_URL}/api/requests', payload);
      alert('Заявка успешно отправлена!');
      reset();
    } catch (error) {
      console.error('Ошибка отправки заявки:', error);
      alert('Ошибка при отправке заявки. Попробуйте снова.');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography
        variant="h5"
        align="center"
        gutterBottom
        sx={{ fontFamily: 'Arial', fontWeight: 'bold', fontSize: '16pt' }}
      >
        Заявка на тестирование ССТО
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ fontFamily: 'Arial', mb: 1 }}>
              Данные судна и стойки ССТО
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Controller
              name="mmsi"
              control={control}
              rules={{
                required: 'MMSI обязателен',
                pattern: {
                  value: /^\d{9}$/,
                  message: 'MMSI должен состоять из 9 цифр',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="MMSI судна"
                  fullWidth
                  error={!!errors.mmsi}
                  helperText={errors.mmsi?.message}
                  sx={{ fontFamily: 'Arial' }}
=======
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
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
                />
              )}
            />
          </Grid>
<<<<<<< HEAD
          <Grid item xs={12} sm={4}>
            <Controller
              name="vesselName"
              control={control}
              rules={{
                required: 'Название судна обязательно',
                maxLength: {
                  value: 50,
                  message: 'Не более 50 символов',
                },
              }}
              render={({ field }) => (
=======
          <Grid item xs={12} md={6}>
            <Controller
              name="vessel_name"
              control={control}
              rules={{ required: 'Название судна обязательно' }}
              render={({ field, fieldState }) => (
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
                <TextField
                  {...field}
                  label="Название судна"
                  fullWidth
<<<<<<< HEAD
                  error={!!errors.vesselName}
                  helperText={errors.vesselName?.message}
                  sx={{ fontFamily: 'Arial' }}
=======
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
                />
              )}
            />
          </Grid>
<<<<<<< HEAD
          <Grid item xs={12} sm={4}>
            <Controller
              name="ssasNumber"
              control={control}
              rules={{
                required: 'Номер стойки ССТО обязателен',
                maxLength: {
                  value: 15,
                  message: 'Не более 15 символов',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Номер стойки ССТО"
                  fullWidth
                  error={!!errors.ssasNumber}
                  helperText={errors.ssasNumber?.message}
                  sx={{ fontFamily: 'Arial' }}
=======
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
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
                />
              )}
            />
          </Grid>
<<<<<<< HEAD
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ fontFamily: 'Arial', mb: 1 }}>
              Контактные данные заявителя
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="ownerOrganization"
              control={control}
              rules={{
                required: 'Организация обязательна',
                maxLength: {
                  value: 50,
                  message: 'Не более 50 символов',
                },
              }}
              render={({ field }) => (
=======
          <Grid item xs={12} md={6}>
            <Controller
              name="owner_organization"
              control={control}
              rules={{ required: 'Судовладелец обязателен' }}
              render={({ field, fieldState }) => (
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
                <TextField
                  {...field}
                  label="Организация-судовладелец"
                  fullWidth
<<<<<<< HEAD
                  error={!!errors.ownerOrganization}
                  helperText={errors.ownerOrganization?.message}
                  sx={{ fontFamily: 'Arial' }}
=======
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
                />
              )}
            />
          </Grid>
<<<<<<< HEAD
          <Grid item xs={12} sm={6}>
            <Controller
              name="contactPerson"
              control={control}
              rules={{
                required: 'Контактное лицо обязательно',
                maxLength: {
                  value: 40,
                  message: 'Не более 40 символов',
                },
              }}
              render={({ field }) => (
=======
          <Grid item xs={12} md={6}>
            <Controller
              name="contact_person"
              control={control}
              rules={{ required: 'Контактное лицо обязательно' }}
              render={({ field, fieldState }) => (
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
                <TextField
                  {...field}
                  label="Контактное лицо"
                  fullWidth
<<<<<<< HEAD
                  error={!!errors.contactPerson}
                  helperText={errors.contactPerson?.message}
                  sx={{ fontFamily: 'Arial' }}
=======
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
                />
              )}
            />
          </Grid>
<<<<<<< HEAD
          <Grid item xs={12} sm={6}>
            <Controller
              name="contactPhone"
              control={control}
              rules={{
                required: 'Телефон обязателен',
                pattern: {
                  value: /^\+\d \(\d{3}\) \d{3}-\d{2}-\d{2}$/,
                  message: 'Формат: +X (XXX) XXX-XX-XX',
                },
              }}
              render={({ field }) => (
                <InputMask {...field} mask="+9 (999) 999-99-99">
                  {(inputProps: any) => (
                    <TextField
                      {...inputProps}
                      label="Контактный телефон"
                      fullWidth
                      error={!!errors.contactPhone}
                      helperText={errors.contactPhone?.message}
                      sx={{ fontFamily: 'Arial' }}
                    />
                  )}
                </InputMask>
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="email"
              control={control}
              rules={{
                required: 'Email обязателен',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Неверный формат email',
                },
                maxLength: {
                  value: 50,
                  message: 'Не более 50 символов',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Электронная почта"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  sx={{ fontFamily: 'Arial' }}
=======
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
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
                />
              )}
            />
          </Grid>
<<<<<<< HEAD
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ fontFamily: 'Arial', mb: 1 }}>
              Планируемое время тестирования
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Controller
              name="testDate"
              control={control}
              rules={{
                required: 'Дата тестирования обязательна',
                validate: (value) =>
                  new Date(value) >= new Date(today) ||
                  'Дата не может быть ранее текущей',
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  label="Дата тестирования"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: today }}
                  error={!!errors.testDate}
                  helperText={errors.testDate?.message}
                  sx={{ fontFamily: 'Arial' }}
=======
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
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
                />
              )}
            />
          </Grid>
<<<<<<< HEAD
          <Grid item xs={12} sm={4}>
            <Controller
              name="startTime"
              control={control}
              rules={{ required: 'Время начала обязательно' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="time"
                  label="Время начала (UTC)"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.startTime}
                  helperText={errors.startTime?.message}
                  sx={{ fontFamily: 'Arial' }}
=======
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
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
                />
              )}
            />
          </Grid>
<<<<<<< HEAD
          <Grid item xs={12} sm={4}>
            <Controller
              name="endTime"
              control={control}
              rules={{
                required: 'Время окончания обязательно',
                validate: (value, formValues) =>
                  !formValues.startTime ||
                  value > formValues.startTime ||
                  'Время окончания должно быть позже начала',
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="time"
                  label="Время окончания (UTC)"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.endTime}
                  helperText={errors.endTime?.message}
                  sx={{ fontFamily: 'Arial' }}
=======
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
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
<<<<<<< HEAD
            <Typography variant="h6" sx={{ fontFamily: 'Arial', mb: 1 }}>
              Дополнительные примечания
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="notes"
              control={control}
              rules={{
                maxLength: {
                  value: 300,
                  message: 'Не более 300 символов',
                },
              }}
=======
            <Controller
              name="notes"
              control={control}
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Примечания"
<<<<<<< HEAD
                  multiline
                  rows={4}
                  fullWidth
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                  sx={{ fontFamily: 'Arial' }}
=======
                  fullWidth
                  multiline
                  rows={2}
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
                />
              )}
            />
          </Grid>
<<<<<<< HEAD

          <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              sx={{ fontFamily: 'Arial', backgroundColor: '#1976d2', color: 'white' }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Отправить заявку'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => reset()}
              sx={{ fontFamily: 'Arial' }}
            >
=======
          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            <Button type="submit" variant="contained" color="primary">
              Отправить заявку
            </Button>
            <Button variant="outlined" onClick={() => reset()} sx={{ ml: 2 }}>
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
              Очистить
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};
<<<<<<< HEAD

=======
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
export default RequestForm;
