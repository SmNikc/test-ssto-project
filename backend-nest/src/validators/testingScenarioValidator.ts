<<<<<<< HEAD
import Joi from 'joi';

const testingScenarioSchema = Joi.object({
  scenario_id: Joi.string().required().messages({
    'any.required': 'ID сценария обязателен',
  }),
  description: Joi.string().max(300).required().messages({
    'string.max': 'Описание не более 300 символов',
    'any.required': 'Описание обязательно',
  }),
  expected_result: Joi.string().max(300).required().messages({
    'string.max': 'Ожидаемый результат не более 300 символов',
    'any.required': 'Ожидаемый результат обязателен',
  }),
  actual_result: Joi.string().max(300).optional().messages({
    'string.max': 'Фактический результат не более 300 символов',
  }),
  status: Joi.string().valid('planned', 'completed', 'failed').default('planned').messages({
    'any.only': 'Статус должен быть planned, completed или failed',
  }),
  comments: Joi.string().max(300).optional().messages({
    'string.max': 'Комментарий не более 300 символов',
  }),
});

export const validateTestingScenario = (data: any) => {
  return testingScenarioSchema.validate(data, { abortEarly: false });
};
=======
CopyEdit
export function validateTestingScenario(data: any): string[] {
#   const errors: string[] = [];
  if (!data.description) errors.push('Не указано описание сценария');
  if (!data.expected_result) errors.push('Не указан ожидаемый результат');
  if (!data.status) errors.push('Не указан статус сценария');
  return errors;
}
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
