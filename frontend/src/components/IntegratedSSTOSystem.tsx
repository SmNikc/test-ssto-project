// frontend/src/components/IntegratedSSTOSystem.tsx
// Интегрированная система ТЕСТ ССТО с просмотром заявок и сигналов

import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmailIcon from '@mui/icons-material/Email';
import DescriptionIcon from '@mui/icons-material/Description';
import PrintIcon from '@mui/icons-material/Print';

// Импортируем существующие компоненты
import RequestList from './RequestList';
import EnhancedSignalList from './EnhancedSignalList';
import RequestForm from './RequestForm';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function IntegratedSSTOSystem() {
  const [tabValue, setTabValue] = useState(0);
  const [viewDialog, setViewDialog] = useState<{
    open: boolean;
    type: 'request' | 'signal' | 'report' | 'email';
    data: any;
  }>({
    open: false,
    type: 'request',
    data: null
  });

  // Функция просмотра заявки
  const viewRequest = (request: any) => {
    setViewDialog({
      open: true,
      type: 'request',
      data: request
    });
  };

  // Функция просмотра сигнала
  const viewSignalEmail = (signal: any) => {
    setViewDialog({
      open: true,
      type: 'email',
      data: signal
    });
  };

  // Функция предпросмотра отчета
  const previewReport = (request: any) => {
    setViewDialog({
      open: true,
      type: 'report',
      data: generateReport(request)
    });
  };

  // Генерация отчета
  const generateReport = (request: any) => {
    return {
      title: 'ПОДТВЕРЖДЕНИЕ ТЕСТИРОВАНИЯ ССТО',
      number: `№ ${request.request_id}`,
      date: new Date().toLocaleDateString('ru-RU'),
      vessel: request.vessel_name,
      mmsi: request.mmsi,
      imo: request.imo || 'Не указан',
      testDate: request.test_date,
      signalReceived: request.signal_received_time || 'Ожидается',
      coordinates: request.signal_coordinates || 'Не получены',
      status: request.status === 'completed' ? 'ТЕСТ ПРОЙДЕН УСПЕШНО' : 'В ОБРАБОТКЕ',
      operator: 'Дежурный ГМСКЦ',
      organization: 'ФГБУ "Морспасслужба"'
    };
  };

  // Модифицированный RequestList с кнопками просмотра
  const EnhancedRequestList = () => {
    const [requests, setRequests] = useState([
      {
        id: 1,
        request_id: 'REQ001',
        vessel_name: 'Капитан Иванов',
        mmsi: '273456789',
        imo: '9234567',
        test_date: '2025-01-15',
        contact_person: 'Иванов И.И.',
        email: 'ivanov@ship.ru',
        status: 'approved',
        signal_received: true,
        signal_email: {
          from: 'alerts@inmarsat.com',
          subject: 'SSAS Test Signal',
          body: 'Signal received at 10:03:25 UTC...',
          time: '10:03:25'
        }
      }
    ]);

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Список заявок с расширенными возможностями
        </Typography>
        
        {requests.map((request) => (
          <Card key={request.id} sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={2}>
                  <Typography variant="subtitle2">Заявка</Typography>
                  <Typography>{request.request_id}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="subtitle2">Судно</Typography>
                  <Typography>{request.vessel_name}</Typography>
                  <Typography variant="caption">MMSI: {request.mmsi}</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="subtitle2">Статус</Typography>
                  <Typography color={request.signal_received ? 'success.main' : 'warning.main'}>
                    {request.signal_received ? 'Сигнал получен' : 'Ожидание'}
                  </Typography>
                </Grid>
                <Grid item xs={5}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Просмотр заявки">
                      <IconButton 
                        color="primary"
                        onClick={() => viewRequest(request)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {request.signal_received && (
                      <Tooltip title="Просмотр email с сигналом">
                        <IconButton 
                          color="info"
                          onClick={() => viewSignalEmail(request.signal_email)}
                        >
                          <EmailIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="Предпросмотр отчета">
                      <IconButton 
                        color="secondary"
                        onClick={() => previewReport(request)}
                      >
                        <DescriptionIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Печать">
                      <IconButton onClick={() => window.print()}>
                        <PrintIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Button 
                      variant="contained" 
                      size="small"
                      color={request.signal_received ? "success" : "primary"}
                      disabled={!request.signal_received}
                    >
                      {request.signal_received ? 'Отправить подтверждение' : 'Ожидание сигнала'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Заявки" />
          <Tab label="Мониторинг сигналов" />
          <Tab label="Новая заявка" />
          <Tab label="Интегрированный вид" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <RequestList />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <EnhancedSignalList />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <RequestForm />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <EnhancedRequestList />
      </TabPanel>

      {/* Диалог просмотра */}
      <Dialog 
        open={viewDialog.open} 
        onClose={() => setViewDialog({ ...viewDialog, open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {viewDialog.type === 'request' && 'Просмотр заявки'}
          {viewDialog.type === 'email' && 'Email с сигналом ССТО'}
          {viewDialog.type === 'report' && 'Предпросмотр отчета'}
        </DialogTitle>
        <DialogContent>
          {/* Просмотр заявки */}
          {viewDialog.type === 'request' && viewDialog.data && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Заявка {viewDialog.data.request_id}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Судно:</Typography>
                  <Typography>{viewDialog.data.vessel_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">MMSI:</Typography>
                  <Typography>{viewDialog.data.mmsi}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">IMO:</Typography>
                  <Typography>{viewDialog.data.imo}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Дата теста:</Typography>
                  <Typography>{viewDialog.data.test_date}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Контактное лицо:</Typography>
                  <Typography>{viewDialog.data.contact_person}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Email:</Typography>
                  <Typography>{viewDialog.data.email}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Просмотр email */}
          {viewDialog.type === 'email' && viewDialog.data && (
            <Box>
              <Typography variant="subtitle2">От:</Typography>
              <Typography gutterBottom>{viewDialog.data.from}</Typography>
              
              <Typography variant="subtitle2">Тема:</Typography>
              <Typography gutterBottom>{viewDialog.data.subject}</Typography>
              
              <Typography variant="subtitle2">Время получения:</Typography>
              <Typography gutterBottom>{viewDialog.data.time}</Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2">Содержание:</Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.100', mt: 1 }}>
                <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  {viewDialog.data.body}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Предпросмотр отчета */}
          {viewDialog.type === 'report' && viewDialog.data && (
            <Box sx={{ p: 2, border: '1px solid #ccc' }}>
              <Typography variant="h5" align="center" gutterBottom>
                {viewDialog.data.title}
              </Typography>
              <Typography align="center" gutterBottom>
                {viewDialog.data.number} от {viewDialog.data.date}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography><strong>Судно:</strong> {viewDialog.data.vessel}</Typography>
              <Typography><strong>MMSI:</strong> {viewDialog.data.mmsi}</Typography>
              <Typography><strong>IMO:</strong> {viewDialog.data.imo}</Typography>
              <Typography><strong>Дата теста:</strong> {viewDialog.data.testDate}</Typography>
              <Typography><strong>Время получения сигнала:</strong> {viewDialog.data.signalReceived}</Typography>
              <Typography><strong>Координаты:</strong> {viewDialog.data.coordinates}</Typography>
              
              <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="h6" align="center">
                  {viewDialog.data.status}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <Typography align="right">
                  <strong>{viewDialog.data.operator}</strong>
                </Typography>
                <Typography align="right">
                  {viewDialog.data.organization}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => window.print()}>Печать</Button>
          <Button onClick={() => setViewDialog({ ...viewDialog, open: false })}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}