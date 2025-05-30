import { Request, Response } from 'express';
import SSASRequest from '../models/request';
import { validateRequest } from '../validators/requestValidator';

// Генерация уникального ID заявки (например, 2025-SSAS-0421-007)
const generateRequestId = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const randomNum = Math.floor(100 + Math.random() * 900); // 3-значный номер
  return `${year}-SSAS-${month}${day}-${randomNum}`;
};

export const createRequest = async (req: Request, res: Response) => {
  try {
    // Валидация данных
    const { error, value } = validateRequest(req.body);
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({ errors });
    }

    const {
      mmsi,
      vessel_name,
      ssas_number,
      owner_organization,
      contact_person,
      contact_phone,
      email,
      test_date,
      start_time,
      end_time,
      notes,
    } = value;

    // Проверка уникальности MMSI (пример, можно настроить по вашим требованиям)
    const existingRequest = await SSASRequest.findOne({ where: { mmsi } });
    if (existingRequest) {
      return res.status(400).json({ error: 'Заявка с таким MMSI уже существует' });
    }

    // Генерация уникального ID
    const request_id = generateRequestId(new Date());

    // Создание записи в БД
    const request = await SSASRequest.create({
      request_id,
      mmsi,
      vessel_name,
      ssas_number,
      owner_organization,
      contact_person,
      contact_phone,
      email,
      test_date,
      start_time,
      end_time,
      notes: notes || null,
    });

    res.status(201).json({
      request_id,
      status: 'registered',
      created_at: request.created_at,
    });
  } catch (error) {
    console.error('Ошибка создания заявки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
