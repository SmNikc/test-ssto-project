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
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

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
  status: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'FAILED';
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

  // Открытие диалога подтверждения
  const handleOpenConfirmDialog = (request: Request) => {
    const now = new Date();
    setConfirmDialog({
      open: true,
      request,
      signalData: {
        receivedTime: now.toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
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
      // 1. Обновляем статус заявки
      const updateResponse = await fetch(
        `http://localhost:3001/requests/${confirmDialog.request.id}/confirm`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'CONFIRMED',
            signal_received_time: confirmDialog.signalData.receivedTime,
            signal_coordinates: confirmDialog.signalData.coordinates,
            signal_strength: confirmDialog.signalData.signalStrength
          })
        }
      );

      if (!updateResponse.ok) {
        throw new Error('Ошибка при подтверждении заявки');
      }

      // 2. Отправляем email с подтверждением
      const emailResponse = await fetch(
        `http://localhost:3001/requests/${confirmDialog.request.id}/send-confirmation`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: confirmDialog.request.email,
            vesselName: confirmDialog.request.vessel_name,
            mmsi: confirmDialog.request.mmsi,
            testDate: confirmDialog.request.test_date,
            receivedTime: confirmDialog.signalData.receivedTime,
            coordinates: confirmDialog.signalData.coordinates,
            contactPerson: confirmDialog.request.contact_person
          })
        }
      );

      if (!emailResponse.ok) {
        console.warn('Не удалось отправить email, но заявка подтверждена');
      }

      // 3. Обновляем список
      await fetchRequests();
      
      // 4. Закрываем диалог
      handleCloseConfirmDialog();
      
      alert('Заявка успешно подтверждена! Уведомление отправлено на ' + confirmDialog.request.email);
    } catch (err) {
      console.error('Error confirming request:', err);
      alert('Ошибка при подтверждении заявки');
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
      case 'CONFIRMED': return 'success';
      case 'PENDING': return 'warning';
      case 'FAILED': return 'error';
      default: return 'default';
    }
  };

  // Получение текста статуса на русском
  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Подтверждено';
      case 'PENDING': return 'Ожидание';
      case 'FAILED': return 'Отклонено';
      case 'DRAFT': return 'Черновик';
      default: return status;
    }
  };

  if (loading) {
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
                  {request.test_date ? format(new Date(request.test_date), 'dd.MM.yyyy', { locale: ru }) : '-'}
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
                  {request.status === 'PENDING' && (
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
                  {request.status === 'CONFIRMED' && (
                    <Typography variant="body2" color="success.main">
                      ✓ Подтверждено
                    </Typography>
                  )}
                  {request.status === 'FAILED' && (
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