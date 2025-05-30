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

      await axios.post('http://localhost:3000/api/requests', payload);
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
                />
              )}
            />
          </Grid>
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
                <TextField
                  {...field}
                  label="Название судна"
                  fullWidth
                  error={!!errors.vesselName}
                  helperText={errors.vesselName?.message}
                  sx={{ fontFamily: 'Arial' }}
                />
              )}
            />
          </Grid>
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
                />
              )}
            />
          </Grid>
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
                <TextField
                  {...field}
                  label="Организация-судовладелец"
                  fullWidth
                  error={!!errors.ownerOrganization}
                  helperText={errors.ownerOrganization?.message}
                  sx={{ fontFamily: 'Arial' }}
                />
              )}
            />
          </Grid>
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
                <TextField
                  {...field}
                  label="Контактное лицо"
                  fullWidth
                  error={!!errors.contactPerson}
                  helperText={errors.contactPerson?.message}
                  sx={{ fontFamily: 'Arial' }}
                />
              )}
            />
          </Grid>
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
                />
              )}
            />
          </Grid>
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
                />
              )}
            />
          </Grid>
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
                />
              )}
            />
          </Grid>
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
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
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
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Примечания"
                  multiline
                  rows={4}
                  fullWidth
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                  sx={{ fontFamily: 'Arial' }}
                />
              )}
            />
          </Grid>

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
              Очистить
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default RequestForm;
