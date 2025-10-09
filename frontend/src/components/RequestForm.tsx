// frontend/src/components/RequestForm.tsx
import React from 'react';
import { Controller, useForm, RegisterOptions } from 'react-hook-form';
import { TextField, Button, Stack } from '@mui/material';

type RequestFormValues = {
  vesselName: string;
  imo: string;          // 7 цифр
  mmsi: string;         // 9 цифр
  testDate: string;     // 'YYYY-MM-DDTHH:mm' (для <input type="datetime-local" />)
  port: string;
  contactName: string;
  contactPhone: string;
  email: string;
  notes?: string;
};

const REQUIRED = (label: string) => ({ required: { value: true, message: `${label} обязателен` } });

// Валидационные правила по полям
const rules = {
  vesselName: {
    ...REQUIRED('Название судна'),
    minLength: { value: 2, message: 'Минимум 2 символа' },
    maxLength: { value: 120, message: 'Слишком длинное значение' },
  },
  imo: {
    ...REQUIRED('IMO'),
    pattern: { value: /^\d{7}$/, message: 'IMO должен состоять из 7 цифр' },
  },
  mmsi: {
    ...REQUIRED('MMSI'),
    pattern: { value: /^\d{9}$/, message: 'MMSI должен состоять из 9 цифр' },
  },
  testDate: {
    ...REQUIRED('Дата/время теста'),
    validate: (value?: string) => (value && value.length > 0) || 'Укажите дату/время',
  },
  port: {
    ...REQUIRED('Порт приписки'),
    minLength: { value: 2, message: 'Минимум 2 символа' },
  },
  contactName: {
    ...REQUIRED('Контактное лицо'),
    minLength: { value: 2, message: 'Минимум 2 символа' },
  },
  contactPhone: {
    ...REQUIRED('Телефон'),
    // Базовая проверка телефона: цифры и допустимые символы
    pattern: {
      value: /^[\d+\-\s()]{6,20}$/,
      message: 'Введите корректный телефон',
    },
  },
  email: {
    ...REQUIRED('E-mail'),
    pattern: {
      // упрощённое правило email
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Введите корректный e-mail',
    },
  },
  notes: {
    maxLength: { value: 1000, message: 'Слишком длинное примечание' },
  },
} satisfies { [K in keyof RequestFormValues]: RegisterOptions<RequestFormValues, K> };

export default function RequestForm() {
  const { control, handleSubmit } = useForm<RequestFormValues>({
    defaultValues: {
      vesselName: '',
      imo: '',
      mmsi: '',
      testDate: '',
      port: '',
      contactName: '',
      contactPhone: '',
      email: '',
      notes: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: RequestFormValues) => {
    // Маппинг полей из camelCase в snake_case для backend
    const request = {
      vessel_name: data.vesselName,  // маппинг camelCase -> snake_case
      mmsi: data.mmsi,
      request_id: `REQ${Date.now()}`,
      ssas_number: `SSAS${data.imo}`,
      owner_organization: 'Test Company',  // или добавьте поле в форму
      contact_person: data.contactName,    // ✅ правильное имя поля
      contact_phone: data.contactPhone,    // ✅ правильное имя поля
      email: data.email,
      test_date: data.testDate?.split('T')[0] || '2025-08-31',
      start_time: '10:00',
      end_time: '14:00',
      notes: data.notes || '',
      status: 'DRAFT'
    };
    
    console.log('Sending request:', request);
    
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      
      const result = await response.json();
      console.log('Response:', result);
      
      if (result.success) {
        alert('Заявка успешно отправлена!');
        // Очистка формы или редирект
      } else {
        alert('Ошибка: ' + result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка отправки заявки');
    }
  };

  const renderText = <
    K extends keyof RequestFormValues
  >(
    name: K,
    label: string,
    type: React.InputHTMLAttributes<HTMLInputElement>['type'] = 'text'
  ) => (
    <Controller
      control={control}
      name={name}
      rules={rules[name]}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          type={type}
          label={label}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message || ' '}
          fullWidth
        />
      )}
    />
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        {renderText('vesselName', 'Название судна')}
        {renderText('imo', 'IMO')}
        {renderText('mmsi', 'MMSI')}
        {renderText('testDate', 'Дата/время теста', 'datetime-local')}
        {renderText('port', 'Порт приписки')}
        {renderText('contactName', 'Контактное лицо')}
        {renderText('contactPhone', 'Телефон')}
        {renderText('email', 'E-mail', 'email')}
        {renderText('notes', 'Примечание')}
        <Button variant="contained" type="submit">Отправить заявку</Button>
      </Stack>
    </form>
  );
}