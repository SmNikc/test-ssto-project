<<<<<<< HEAD
import Joi from 'joi';

const requestSchema = Joi.object({
  mmsi: Joi.string()
    .pattern(/^\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'MMSI должен состоять из 9 цифр',
      'any.required': 'MMSI обязателен',
    }),
  vessel_name: Joi.string()
    .max(50)
    .required()
    .messages({
      'string.max': 'Название судна не более 50 символов',
      'any.required': 'Название судна обязательно',
    }),
  ssas_number: Joi.string()
    .max(15)
    .required()
    .messages({
      'string.max': 'Номер стойки ССТО не более 15 символов',
      'any.required': 'Номер стойки ССТО обязателен',
    }),
  owner_organization: Joi.string()
    .max(50)
    .required()
    .messages({
      'string.max': 'Организация не более 50 символов',
      'any.required': 'Организация обязательна',
    }),
  contact_person: Joi.string()
    .max(40)
    .required()
    .messages({
      'string.max': 'Контактное лицо не более 40 символов',
      'any.required': 'Контактное лицо обязательно',
    }),
  contact_phone: Joi.string()
    .pattern(/^\+\d \(\d{3}\) \d{3}-\d{2}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Телефон должен быть в формате +X (XXX) XXX-XX-XX',
      'any.required': 'Телефон обязателен',
    }),
  email: Joi.string()
    .email()
    .max(50)
    .required()
    .messages({
      'string.email': 'Неверный формат email',
      'string.max': 'Email не более 50 символов',
      'any.required': 'Email обязателен',
    }),
  test_date: Joi.date()
    .min('now')
    .required()
    .messages({
      'date.min': 'Дата тестирования не ранее текущей',
      'any.required': 'Дата тестирования обязательна',
    }),
  start_time: Joi.string()
    .pattern(/^([0-1]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      'string.pattern.base': 'Время начала в формате HH:MM',
      'any.required': 'Время начала обязательно',
    }),
  end_time: Joi.string()
    .pattern(/^([0-1]\d|2[0-3]):[0-5]\d$/)
    .required()
    .custom((value, helpers) => {
      const startTime = helpers.state.ancestors[0].start_time;
      if (startTime && value <= startTime) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .messages({
      'string.pattern.base': 'Время окончания в формате HH:MM',
      'any.required': 'Время окончания обязательно',
      'any.invalid': 'Время окончания должно быть позже времени начала',
    }),
  notes: Joi.string()
    .max(300)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Примечания не более 300 символов',
    }),
});

export const validateRequest = (data: any) => {
  return requestSchema.validate(data, { abortEarly: false });
};
=======
CopyEdit
export function validateRequest(data: any): string[] {
#   const errors: string[] = [];
  if (!data.mmsi || String(data.mmsi).length !== 9) errors.push('MMSI должен быть 9-значным');
  if (!data.vessel_name) errors.push('Не указано название судна');
  if (!data.ssas_number) errors.push('Не указан номер ССТО');
  if (!data.owner_organization) errors.push('Не указана организация-владелец');
  if (!data.contact_person) errors.push('Не указано контактное лицо');
  if (!data.contact_phone) errors.push('Не указан телефон');
  if (!data.email) errors.push('Не указан email');
  if (!data.test_date) errors.push('Не указана дата теста');
  if (!data.start_time) errors.push('Не указано время начала');
  if (!data.end_time) errors.push('Не указано время окончания');
  return errors;
}
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
