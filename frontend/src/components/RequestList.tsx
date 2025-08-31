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

interface Request {
  id?: number;
  request_id?: string;
  vessel_name: string;
  mmsi: string;
  test_type?: string;
  test_date?: string;
  start_date?: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  status: string;
  created_at?: string;
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
        const result = await response.json();
        // Обработка разных форматов ответа
        if (result.data && Array.isArray(result.data)) {
          setRequests(result.data);
        } else if (Array.isArray(result)) {
          setRequests(result);
        } else {
          console.error('Unexpected response format:', result);
          setRequests([]);
        }
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): any => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'success';
      case 'COMPLETED': return 'primary';
      case 'PENDING': return 'warning';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const filteredRequests = Array.isArray(requests) 
    ? requests.filter(req => 
        req.vessel_name?.toLowerCase().includes(filter.toLowerCase()) ||
        req.mmsi?.includes(filter) ||
        req.status?.toLowerCase().includes(filter.toLowerCase())
      )
    : [];

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
            onClick={fetchRequests}
          >
            🔄 Обновить
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
              <TableCell>Дата теста</TableCell>
              <TableCell>Время</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.map((request, index) => (
              <TableRow key={request.request_id || request.id || index}>
                <TableCell>{request.request_id || request.id || index + 1}</TableCell>
                <TableCell>{request.vessel_name}</TableCell>
                <TableCell>{request.mmsi}</TableCell>
                <TableCell>
                  {request.test_date 
                    ? new Date(request.test_date).toLocaleDateString() 
                    : request.start_date 
                    ? new Date(request.start_date).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell>
                  {request.start_time || '-'} - {request.end_time || '-'}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={request.status} 
                    color={getStatusColor(request.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" title="Просмотр">
                    <span>👁️</span>
                  </IconButton>
                  <IconButton size="small" title="Редактировать">
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