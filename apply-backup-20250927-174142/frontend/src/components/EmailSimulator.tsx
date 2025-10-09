// frontend/src/components/EmailSimulator.tsx
// Компонент для демонстрации обработки email-заявок

import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Box } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';

export default function EmailSimulator() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Предзаполненные email для демо
  const demoEmails = [
    {
      from: 'captain@vessel.ru',
      subject: 'Тест ССТО',
      body: 'Добрый день! Прошу провести тестирование системы ССТО на судне "Морской Орел" (MMSI 273456789). Завтра в 10:00 по московскому времени. С уважением, Капитан Иванов',
    },
    {
      from: 'shipping@baltic.ru', 
      subject: 'Заявка на проверку аппаратуры',
      body: 'Требуется тестирование ССТО. Судно: Балтийский Ветер, MMSI: 273567890, IMO: 9345678. Дата: 16 января, время 14:30. Контакт: Смирнова Е.В., тел. +7-812-345-67-89',
    },
    {
      from: 'port@novorossiysk.ru',
      subject: 'СРОЧНО! Тест ССТО',
      body: 'СРОЧНО требуется провести внеплановое тестирование ССТО! Судно: Черноморец, MMSI: 273678901. Порт: Новороссийск. Время: сегодня, как можно скорее. Портовые власти требуют подтверждение.',
    }
  ];

  const simulateEmailProcessing = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Имитируем обработку email
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Создаем заявки через обычный API
      const results = [];
      for (const email of demoEmails) {
        const requestData = {
          vessel_name: extractVesselName(email.body),
          mmsi: extractMMSI(email.body),
          request_id: `EMAIL${Date.now()}${Math.floor(Math.random() * 100)}`,
          ssas_number: `SSAS${Math.floor(900000 + Math.random() * 100000)}`,
          owner_organization: email.from.split('@')[0].toUpperCase() + ' Shipping',
          contact_person: extractContactPerson(email),
          contact_phone: '+7 (900) ' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(10 + Math.random() * 90) + '-' + Math.floor(10 + Math.random() * 90),
          contact_email: email.from,
          test_date: new Date().toISOString().split('T')[0],
          start_time: '10:00',
          end_time: '14:00',
          notes: `Заявка получена по email. Тема: ${email.subject}`,
          status: 'PENDING'
        };

        const response = await fetch('http://localhost:3001/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });

        if (response.ok) {
          results.push({ success: true, vessel: requestData.vessel_name });
        }
      }

      setResult({
        total: demoEmails.length,
        processed: results.length,
        vessels: results.map(r => r.vessel)
      });

    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'Ошибка обработки' });
    } finally {
      setLoading(false);
    }
  };

  // Вспомогательные функции
  const extractVesselName = (text: string): string => {
    const patterns = [
      /судн[оеа]\s*[:"]?\s*([^,\n"]+)/i,
      /Судно:\s*([^,\n]+)/i,
      /"([^"]+)"/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    return 'Судно ' + Math.floor(100 + Math.random() * 900);
  };

  const extractMMSI = (text: string): string => {
    const match = text.match(/MMSI\s*:?\s*(\d{9})/i);
    return match ? match[1] : '273' + Math.floor(100000 + Math.random() * 900000);
  };

  const extractContactPerson = (email: any): string => {
    const names = ['Иванов И.И.', 'Петров П.П.', 'Смирнова Е.В.', 'Козлов А.С.'];
    return names[Math.floor(Math.random() * names.length)];
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<EmailIcon />}
        onClick={() => setOpen(true)}
        sx={{ mb: 2 }}
      >
        Обработать Email-заявки
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Симуляция обработки email-заявок</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Система автоматически обрабатывает входящие email и создает заявки из неформализованных писем
          </Alert>

          <Box sx={{ mb: 2 }}>
            <strong>Будут обработаны письма от:</strong>
            <ul>
              <li>captain@vessel.ru - запрос на тестирование</li>
              <li>shipping@baltic.ru - плановая проверка</li>
              <li>port@novorossiysk.ru - срочное тестирование</li>
            </ul>
          </Box>

          {result && (
            <Alert severity={result.error ? "error" : "success"} sx={{ mt: 2 }}>
              {result.error ? result.error : 
                `Обработано писем: ${result.total}. Создано заявок: ${result.processed}.
                Суда: ${result.vessels?.join(', ')}`
              }
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Закрыть</Button>
          <Button 
            onClick={simulateEmailProcessing} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Обработка...' : 'Начать обработку'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// Добавьте этот компонент на страницу со списком заявок:
// В RequestsPage.tsx или App.tsx:
/*
import EmailSimulator from './components/EmailSimulator';

// В разметке, над таблицей:
<EmailSimulator />
<RequestList />
*/