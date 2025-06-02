import Joi from 'joi';

const signalSchema = Joi.object({
  signal_id: Joi.string().required().messages({
    'any.required': 'Signal ID обязателен',
  }),
  mmsi: Joi.string().pattern(/^\d{9}$/).required().messages({
    'string.pattern.base': 'MMSI должен состоять из 9 цифр',
    'any.required': 'MMSI обязателен',
  }),
  signal_type: Joi.string().valid('test', 'alert', 'unscheduled').required().messages({
    'any.only': 'Тип сигнала должен быть test, alert или unscheduled',
    'any.required': 'Тип сигнала обязателен',
  }),
  received_at: Joi.date().required().messages({
    'any.required': 'Время получения обязательно',
  }),
  coordinates: Joi.string().pattern(/^-?\d{1,3}\.\d+,-?\d{1,3}\.\d+$/).optional().messages({
    'string.pattern.base': 'Координаты должны быть в формате latitude,longitude',
  }),
  status: Joi.string().valid('unlinked', 'processing', 'completed', 'rejected').default('unlinked').messages({
    'any.only': 'Статус должен быть unlinked, processing, completed или rejected',
  }),
  comments: Joi.string().max(300).optional().messages({
    'string.max': 'Комментарий не более 300 символов',
  }),
});

export const validateSignal = (data: any) => {
  return signalSchema.validate(data, { abortEarly: false });
};
