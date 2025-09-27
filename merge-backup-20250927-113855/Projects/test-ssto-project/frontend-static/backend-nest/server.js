// backend/server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Инициализация базы данных
const db = new sqlite3.Database('./ssto_requests.db');

// Создание таблицы, если не существует
db.run(`
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT UNIQUE NOT NULL,
    vessel_name TEXT NOT NULL,
    mmsi TEXT NOT NULL,
    ssas_number TEXT,
    owner_organization TEXT,
    contact_person TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    email TEXT NOT NULL,
    test_date DATE,
    start_time TEXT,
    end_time TEXT,
    notes TEXT,
    status TEXT DEFAULT 'DRAFT',
    signal_received_time TEXT,
    signal_coordinates TEXT,
    signal_strength TEXT,
    confirmation_sent_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Настройка nodemailer для отправки email
// ВАЖНО: Замените на реальные данные SMTP сервера
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // или ваш SMTP сервер
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Проверка подключения к email серверу
transporter.verify(function(error, success) {
  if (error) {
    console.log('Email сервер недоступен:', error);
  } else {
    console.log('Email сервер готов к отправке сообщений');
  }
});

// GET: Получить все заявки
app.get('/requests', (req, res) => {
  db.all('SELECT * FROM requests ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, data: rows });
  });
});

// GET: Получить заявку по ID
app.get('/requests/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM requests WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!row) {
      return res.status(404).json({ success: false, error: 'Заявка не найдена' });
    }
    res.json({ success: true, data: row });
  });
});

// POST: Создать новую заявку
app.post('/requests', (req, res) => {
  const {
    vessel_name,
    mmsi,
    request_id = `REQ${Date.now()}`,
    ssas_number,
    owner_organization,
    contact_person,
    contact_phone,
    email,
    test_date,
    start_time,
    end_time,
    notes,
    status = 'PENDING'
  } = req.body;

  const sql = `
    INSERT INTO requests (
      request_id, vessel_name, mmsi, ssas_number, owner_organization,
      contact_person, contact_phone, email, test_date, start_time, 
      end_time, notes, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    request_id, vessel_name, mmsi, ssas_number, owner_organization,
    contact_person, contact_phone, email, test_date, start_time,
    end_time, notes, status
  ];

  db.run(sql, params, function(err) {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ 
      success: true, 
      data: { 
        id: this.lastID, 
        request_id,
        status: 'Заявка успешно создана' 
      } 
    });
  });
});

// POST: Подтвердить заявку (обновить статус)
app.post('/requests/:id/confirm', (req, res) => {
  const { id } = req.params;
  const { 
    status, 
    signal_received_time, 
    signal_coordinates, 
    signal_strength 
  } = req.body;

  const sql = `
    UPDATE requests 
    SET status = ?, 
        signal_received_time = ?,
        signal_coordinates = ?,
        signal_strength = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(sql, [status, signal_received_time, signal_coordinates, signal_strength, id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: 'Заявка не найдена' });
    }
    res.json({ success: true, message: 'Статус заявки обновлен' });
  });
});

// POST: Отправить email подтверждение
app.post('/requests/:id/send-confirmation', async (req, res) => {
  const { id } = req.params;
  const { 
    email, 
    vesselName, 
    mmsi, 
    testDate, 
    receivedTime, 
    coordinates,
    contactPerson 
  } = req.body;

  // HTML шаблон письма
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; color: #333; }
        .footer { margin-top: 30px; padding: 20px; background: #ecf0f1; text-align: center; font-size: 12px; }
        .success { color: #27ae60; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>МИНТРАНС РОССИИ</h2>
          <h3>ФГБУ "МОРСПАССЛУЖБА"</h3>
          <p>Подтверждение тестового сообщения ССТО</p>
        </div>
        
        <div class="content">
          <p>Уважаемый(ая) ${contactPerson},</p>
          
          <p class="success">✓ Тестовый сигнал ССТО успешно получен и обработан!</p>
          
          <div class="field">
            <span class="label">Судно:</span> ${vesselName}
          </div>
          <div class="field">
            <span class="label">MMSI:</span> ${mmsi}
          </div>
          <div class="field">
            <span class="label">Дата теста:</span> ${testDate}
          </div>
          <div class="field">
            <span class="label">Время получения сигнала:</span> ${receivedTime}
          </div>
          ${coordinates ? `
          <div class="field">
            <span class="label">Координаты:</span> ${coordinates}
          </div>
          ` : ''}
          
          <p style="margin-top: 20px;">
            Данное письмо подтверждает успешное прохождение тестирования 
            системы судовой тревожной сигнализации (ССТО/SSAS).
          </p>
          
          <p>
            При возникновении вопросов обращайтесь в ГМСКЦ по телефону: +7 (495) XXX-XX-XX
          </p>
        </div>
        
        <div class="footer">
          <p>Это автоматическое сообщение. Пожалуйста, не отвечайте на него.</p>
          <p>© ${new Date().getFullYear()} ФГБУ "Морспасслужба"</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Текстовая версия письма
  const textContent = `
МИНТРАНС РОССИИ
ФГБУ "МОРСПАССЛУЖБА"

Подтверждение тестового сообщения ССТО

Уважаемый(ая) ${contactPerson},

Тестовый сигнал ССТО успешно получен и обработан!

Судно: ${vesselName}
MMSI: ${mmsi}
Дата теста: ${testDate}
Время получения сигнала: ${receivedTime}
${coordinates ? `Координаты: ${coordinates}` : ''}

Данное письмо подтверждает успешное прохождение тестирования 
системы судовой тревожной сигнализации (ССТО/SSAS).

При возникновении вопросов обращайтесь в ГМСКЦ по телефону: +7 (495) XXX-XX-XX

---
Это автоматическое сообщение. Пожалуйста, не отвечайте на него.
© ${new Date().getFullYear()} ФГБУ "Морспасслужба"
  `;

  try {
    // Отправка email
    const info = await transporter.sendMail({
      from: '"ГМСКЦ Морспасслужба" <noreply@morspas.ru>',
      to: email,
      subject: `Подтверждение теста ССТО - ${vesselName} (MMSI: ${mmsi})`,
      text: textContent,
      html: htmlContent
    });

    // Обновляем время отправки подтверждения в БД
    db.run(
      'UPDATE requests SET confirmation_sent_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id],
      (err) => {
        if (err) console.error('Ошибка обновления времени отправки:', err);
      }
    );

    res.json({ 
      success: true, 
      message: 'Email успешно отправлен',
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('Ошибка отправки email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Не удалось отправить email. Проверьте настройки SMTP.' 
    });
  }
});

// PUT: Обновить заявку
app.put('/requests/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Формируем SQL запрос для обновления только переданных полей
  const fields = Object.keys(updates).filter(key => key !== 'id');
  const sql = `
    UPDATE requests 
    SET ${fields.map(f => `${f} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  const values = [...fields.map(f => updates[f]), id];

  db.run(sql, values, function(err) {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: 'Заявка не найдена' });
    }
    res.json({ success: true, message: 'Заявка обновлена' });
  });
});

// DELETE: Удалить заявку
app.delete('/requests/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM requests WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: 'Заявка не найдена' });
    }
    res.json({ success: true, message: 'Заявка удалена' });
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`API доступно по адресу: http://localhost:${PORT}`);
  console.log('\nДоступные эндпоинты:');
  console.log('GET    /requests           - Получить все заявки');
  console.log('GET    /requests/:id       - Получить заявку по ID');
  console.log('POST   /requests           - Создать новую заявку');
  console.log('POST   /requests/:id/confirm - Подтвердить заявку');
  console.log('POST   /requests/:id/send-confirmation - Отправить email');
  console.log('PUT    /requests/:id       - Обновить заявку');
  console.log('DELETE /requests/:id       - Удалить заявку');
});