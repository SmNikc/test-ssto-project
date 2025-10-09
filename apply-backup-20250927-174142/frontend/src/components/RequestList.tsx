// frontend/src/components/RequestList.tsx
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Box
} from '@mui/material';

interface Request {
  id: number;
  request_id: string;
  vessel_name: string;
  mmsi: string;
  ssas_number: string;
  test_date: string;
  start_time: string;
  end_time: string;
  contact_person: string;
  contact_phone: string;
  email: string;
  status: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'FAILED' | 'approved' | 'completed' | 'rejected';
  owner_organization?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ConfirmDialogData {
  open: boolean;
  request: Request | null;
  signalData: {
    receivedTime: string;
    coordinates: string;
    signalStrength: string;
  };
}

export default function RequestList() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogData>({
    open: false,
    request: null,
    signalData: {
      receivedTime: '',
      coordinates: '',
      signalStrength: ''
    }
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Загрузка списка заявок
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/requests');
      if (!response.ok) throw new Error('Ошибка загрузки заявок');
      
      const data = await response.json();
      setRequests(data.data || []);
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить список заявок');
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Обновляем список каждые 30 секунд
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  // Функция генерации отчета
  const generateReport = () => {
    const reportData = {
      date: new Date().toLocaleDateString('ru-RU'),
      time: new Date().toLocaleTimeString('ru-RU'),
      total: requests.length,
      confirmed: requests.filter(r => r.status === 'completed' || r.status === 'CONFIRMED').length,
      pending: requests.filter(r => r.status === 'PENDING' || r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected' || r.status === 'FAILED').length,
      vessels: requests.map(r => ({
        name: r.vessel_name,
        mmsi: r.mmsi,
        status: getStatusText(r.status),
        date: r.test_date
      }))
    };

    // Создаем текстовый отчет
    const reportText = `
ОТЧЕТ ПО ЗАЯВКАМ ССТО
Дата формирования: ${reportData.date} ${reportData.time}
=====================================

СТАТИСТИКА:
- Всего заявок: ${reportData.total}
- Подтверждено: ${reportData.confirmed}
- Ожидает обработки: ${reportData.pending}
- Отклонено: ${reportData.rejected}

ДЕТАЛИЗАЦИЯ ПО СУДАМ:
${reportData.vessels.map((v, i) => 
  `${i + 1}. ${v.name} (MMSI: ${v.mmsi})
   Статус: ${v.status}
   Дата теста: ${v.date || 'не указана'}`
).join('\n\n')}
=====================================
    `;

    // Открываем в новом окне для печати/сохранения
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write('<pre>' + reportText + '</pre>');
      newWindow.document.title = 'Отчет ССТО';
    }
  };
  const createEmailRequests = async () => {
    if (!confirm('Создать 3 демо-заявки как будто пришли по email?')) return;
    
    setLoading(true);
    const demoRequests = [
      {
        vessel_name: "Морской Орел",
        mmsi: "273456789",
        request_id: `EMAIL${Date.now()}1`,
        ssas_number: "SSAS9234567",
        owner_organization: "Captain Shipping",
        contact_person: "Капитан Иванов И.И.",
        contact_phone: "+7 (900) 123-45-67",
        email: "captain@vessel.ru",
        test_date: new Date().toISOString().split('T')[0],
        start_time: "10:00",
        end_time: "14:00",
        status: "PENDING",
        notes: "Заявка получена по email: 'Тест ССТО'. Прошу провести тестирование системы ССТО."
      },
      {
        vessel_name: "Балтийский Ветер",
        mmsi: "273567890",
        request_id: `EMAIL${Date.now()}2`,
        ssas_number: "SSAS9345678",
        owner_organization: "Baltic Shipping",
        contact_person: "Смирнова Е.В.",
        contact_phone: "+7 (812) 345-67-89",
        email: "shipping@baltic.ru",
        test_date: new Date().toISOString().split('T')[0],
        start_time: "14:30",
        end_time: "18:30",
        status: "PENDING",
        notes: "Заявка получена по email: 'Заявка на проверку аппаратуры'. Требуется тестирование ССТО."
      },
      {
        vessel_name: "Черноморец",
        mmsi: "273678901",
        request_id: `EMAIL${Date.now()}3`,
        ssas_number: "SSAS9456789",
        owner_organization: "Port Authority",
        contact_person: "Григорьев П.С.",
        contact_phone: "+7 (8617) 67-89-01",
        email: "port@novorossiysk.ru",
        test_date: new Date().toISOString().split('T')[0],
        start_time: "09:00",
        end_time: "13:00",
        status: "PENDING",
        notes: "Заявка получена по email: 'СРОЧНО! Тест ССТО'. Портовые власти требуют подтверждение."
      }
    ];

    let successCount = 0;
    for (const req of demoRequests) {
      try {
        const response = await fetch('http://localhost:3001/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req)
        });
        if (response.ok) successCount++;
      } catch (error) {
        console.error('Error creating request:', error);
      }
    }
    
    await fetchRequests();
    alert(`Система обработала входящие email.\nСоздано заявок: ${successCount} из 3\nСуда: Морской Орел, Балтийский Ветер, Черноморец`);
    setLoading(false);
  };

  // Открытие диалога подтверждения
  const handleOpenConfirmDialog = (request: Request) => {
    const now = new Date();
    setConfirmDialog({
      open: true,
      request,
      signalData: {
        receivedTime: now.toISOString().slice(0, 16),
        coordinates: '',
        signalStrength: ''
      }
    });
  };

  // Закрытие диалога
  const handleCloseConfirmDialog = () => {
    setConfirmDialog({
      ...confirmDialog,
      open: false
    });
  };

  // Подтверждение заявки и отправка email
  const handleConfirmRequest = async () => {
    if (!confirmDialog.request) return;

    setConfirmLoading(true);
    try {
      // Используем существующий эндпоинт вашего backend
      const response = await fetch(
        `http://localhost:3001/api/requests/${confirmDialog.request.id}/send-confirmation`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            send_email: true,
            generate_pdf: true,
            test_mode: false
          })
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Ошибка при отправке подтверждения');
      }

      // Обновляем список
      await fetchRequests();
      
      // Закрываем диалог
      handleCloseConfirmDialog();
      
      alert(`Заявка успешно подтверждена! ${result.message || 'Уведомление отправлено.'}`);
    } catch (err) {
      console.error('Error confirming request:', err);
      alert(err.message || 'Ошибка при подтверждении заявки');
    } finally {
      setConfirmLoading(false);
    }
  };

  // Отклонение заявки
  const handleRejectRequest = async (request: Request) => {
    if (!confirm(`Отклонить заявку ${request.request_id}?`)) return;

    try {
      const response = await fetch(
        `http://localhost:3001/requests/${request.id}/confirm`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'FAILED' })
        }
      );

      if (!response.ok) throw new Error('Ошибка при отклонении заявки');
      
      await fetchRequests();
      alert('Заявка отклонена');
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert('Ошибка при отклонении заявки');
    }
  };

  // Получение цвета для статуса
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'completed':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'approved':
        return 'info';
      case 'FAILED':
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  // Получение текста статуса на русском
  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED': 
      case 'completed': 
        return 'Подтверждено';
      case 'PENDING': 
        return 'Ожидание';
      case 'approved': 
        return 'Одобрено';
      case 'FAILED': 
      case 'rejected': 
        return 'Отклонено';
      case 'DRAFT': 
        return 'Черновик';
      default: 
        return status;
    }
  };

  if (loading && requests.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <>
      {/* Панель с кнопками */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        {/* Кнопка для демо email-заявок */}
        <Button 
          variant="contained" 
          color="primary"
          onClick={createEmailRequests}
          disabled={loading}
        >
          📧 Обработать Email-заявки (демо)
        </Button>

        {/* Кнопки отчетов */}
        <Button 
          variant="outlined" 
          color="secondary"
          onClick={generateReport}
        >
          📊 Отчет за период
        </Button>

        <Button 
          variant="outlined" 
          color="secondary"
          onClick={() => window.print()}
        >
          🖨️ Печать списка
        </Button>

        <Button 
          variant="outlined" 
          color="info"
          onClick={() => {
            const confirmed = requests.filter(r => r.status === 'completed' || r.status === 'CONFIRMED').length;
            const pending = requests.filter(r => r.status === 'PENDING' || r.status === 'approved').length;
            const rejected = requests.filter(r => r.status === 'rejected' || r.status === 'FAILED').length;
            alert(`Статистика:\n\nВсего заявок: ${requests.length}\nПодтверждено: ${confirmed}\nОжидает: ${pending}\nОтклонено: ${rejected}`);
          }}
        >
          📈 Статистика
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>№ Заявки</TableCell>
              <TableCell>Судно</TableCell>
              <TableCell>MMSI</TableCell>
              <TableCell>Дата теста</TableCell>
              <TableCell>Контакт</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.request_id}</TableCell>
                <TableCell>{request.vessel_name}</TableCell>
                <TableCell>{request.mmsi}</TableCell>
                <TableCell>
                  {request.test_date ? new Date(request.test_date).toLocaleDateString('ru-RU') : '-'}
                </TableCell>
                <TableCell>{request.contact_person}</TableCell>
                <TableCell>{request.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={getStatusText(request.status)}
                    color={getStatusColor(request.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {(request.status === 'PENDING' || request.status === 'approved') && (
                    <>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleOpenConfirmDialog(request)}
                        sx={{ mr: 1 }}
                      >
                        Подтвердить
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleRejectRequest(request)}
                      >
                        Отклонить
                      </Button>
                    </>
                  )}
                  {(request.status === 'CONFIRMED' || request.status === 'completed') && (
                    <Typography variant="body2" color="success.main">
                      ✓ Подтверждено
                    </Typography>
                  )}
                  {(request.status === 'FAILED' || request.status === 'rejected') && (
                    <Typography variant="body2" color="error.main">
                      ✗ Отклонено
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Диалог подтверждения */}
      <Dialog open={confirmDialog.open} onClose={handleCloseConfirmDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Подтверждение получения сигнала ССТО</DialogTitle>
        <DialogContent>
          {confirmDialog.request && (
            <>
              <Typography variant="body2" gutterBottom>
                <strong>Судно:</strong> {confirmDialog.request.vessel_name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>MMSI:</strong> {confirmDialog.request.mmsi}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Email для уведомления:</strong> {confirmDialog.request.email}
              </Typography>
              
              <Box mt={3}>
                <TextField
                  fullWidth
                  label="Время получения сигнала"
                  type="datetime-local"
                  value={confirmDialog.signalData.receivedTime}
                  onChange={(e) => setConfirmDialog({
                    ...confirmDialog,
                    signalData: {
                      ...confirmDialog.signalData,
                      receivedTime: e.target.value
                    }
                  })}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
                
                <TextField
                  fullWidth
                  label="Координаты"
                  placeholder="Например: 43°35'N 39°43'E"
                  value={confirmDialog.signalData.coordinates}
                  onChange={(e) => setConfirmDialog({
                    ...confirmDialog,
                    signalData: {
                      ...confirmDialog.signalData,
                      coordinates: e.target.value
                    }
                  })}
                  margin="normal"
                />
                
                <TextField
                  fullWidth
                  label="Уровень сигнала"
                  placeholder="Например: Хороший / Средний / Слабый"
                  value={confirmDialog.signalData.signalStrength}
                  onChange={(e) => setConfirmDialog({
                    ...confirmDialog,
                    signalData: {
                      ...confirmDialog.signalData,
                      signalStrength: e.target.value
                    }
                  })}
                  margin="normal"
                />
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                После подтверждения на адрес {confirmDialog.request.email} будет отправлено 
                уведомление об успешном прохождении теста ССТО.
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} disabled={confirmLoading}>
            Отмена
          </Button>
          <Button 
            onClick={handleConfirmRequest} 
            variant="contained" 
            color="success"
            disabled={confirmLoading || !confirmDialog.signalData.receivedTime}
          >
            {confirmLoading ? <CircularProgress size={20} /> : 'Подтвердить и отправить'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}