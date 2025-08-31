import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  TextField,
  Grid
} from '@mui/material';
import { Link } from 'react-router-dom';
// import EditIcon from '@mui/icons-material/Edit';
// import VisibilityIcon from '@mui/icons-material/Visibility';
// import RefreshIcon from '@mui/icons-material/Refresh';

interface Request {
  id: number;
  vessel_name: string;
  mmsi: string;
  test_type: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  signals_count?: number;
}

export default function RequestList() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'COMPLETED': return 'primary';
      case 'PENDING': return 'warning';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getTestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'EPIRB_406': 'АРБ 406 МГц',
      'SART': 'Радиолокационный ответчик',
      'AIS_SART': 'АИС-SART',
      'VHF_DSC': 'УКВ ЦИВ',
      'MF_DSC': 'ПВ ЦИВ',
      'HF_DSC': 'КВ ЦИВ',
      'INMARSAT': 'Inmarsat-C'
    };
    return labels[type] || type;
  };

  const filteredRequests = requests.filter(req => 
    req.vessel_name.toLowerCase().includes(filter.toLowerCase()) ||
    req.mmsi.includes(filter) ||
    req.status.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Список заявок на тестирование
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Поиск по названию судна, MMSI или статусу"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            variant="outlined"
            size="small"
          />
        </Grid>
        <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<span>🔄</span>}
            // startIcon={<RefreshIcon />} → startIcon={<span>🔄</span>}
            onClick={fetchRequests}
          >
            Обновить
          </Button>
          <Button
            variant="contained"
            component={Link}
            to="/request"
          >
            Новая заявка
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>№</TableCell>
              <TableCell>Судно</TableCell>
              <TableCell>MMSI</TableCell>
              <TableCell>Тип теста</TableCell>
              <TableCell>Период</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Сигналы</TableCell>
              <TableCell>Создана</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.id}</TableCell>
                <TableCell>{request.vessel_name}</TableCell>
                <TableCell>{request.mmsi}</TableCell>
                <TableCell>{getTestTypeLabel(request.test_type)}</TableCell>
                <TableCell>
                  {new Date(request.start_date).toLocaleDateString()} - 
                  {new Date(request.end_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={request.status} 
                    color={getStatusColor(request.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{request.signals_count || 0}</TableCell>
                <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton size="small" title="Просмотр">
                    <span>👁️</span>
                   // <VisibilityIcon /> → <span>👁️</span>
                  </IconButton>
                  <IconButton size="small" title="Редактировать">
                    // <EditIcon /> → <span>✏️</span>
                    <span>✏️</span>
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {loading && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography>Загрузка...</Typography>
        </Box>
      )}

      {!loading && filteredRequests.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography>Заявки не найдены</Typography>
        </Box>
      )}
    </Box>
  );
}