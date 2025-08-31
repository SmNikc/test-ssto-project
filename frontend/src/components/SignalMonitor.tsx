// frontend/src/components/SignalMonitor.tsx
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
  TextField,
  Grid
} from '@mui/material';

interface Signal {
  id: number;
  mmsi: string;
  vessel_name?: string;
  received_at: string;
  status: string;
  latitude?: string;
  longitude?: string;
  request_id?: string;
  metadata?: any;
}

export default function SignalMonitor() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filter, setFilter] = useState('');
  const [stats, setStats] = useState<any>(null);

  const fetchSignals = async () => {
    try {
      const response = await fetch('http://localhost:3000/signals');
      const data = await response.json();
      setSignals(data);
    } catch (error) {
      console.error('Error fetching signals:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `http://localhost:3000/signals/statistics?startDate=${today}&endDate=${today}`
      );
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchSignals();
    fetchStats();
    const interval = setInterval(() => {
      fetchSignals();
      fetchStats();
    }, 10000); // обновление каждые 10 сек
    return () => clearInterval(interval);
  }, []);

  const filteredSignals = signals.filter(s => 
    !filter || s.mmsi.includes(filter) || s.status.includes(filter)
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Мониторинг сигналов ССТО
      </Typography>
      
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">{stats.total}</Typography>
              <Typography variant="body2">Всего сигналов</Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">{stats.byStatus?.MATCHED || 0}</Typography>
              <Typography variant="body2">Сопоставлено</Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">{stats.byStatus?.ERROR || 0}</Typography>
              <Typography variant="body2">Ошибки</Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">{stats.byType?.SSAS_TEST || 0}</Typography>
              <Typography variant="body2">SSAS тестов</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      <TextField
        fullWidth
        label="Фильтр по MMSI или статусу"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>MMSI</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>Время</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Заявка</TableCell>
              <TableCell>Координаты</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSignals.map((signal) => (
              <TableRow key={signal.id}>
                <TableCell>{signal.id}</TableCell>
                <TableCell>{signal.mmsi}</TableCell>
                <TableCell>{signal.metadata?.signal_type || 'UNKNOWN'}</TableCell>
                <TableCell>{new Date(signal.received_at).toLocaleString()}</TableCell>
                <TableCell>
                  <Chip 
                    label={signal.status} 
                    color={signal.status === 'MATCHED' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{signal.request_id || '-'}</TableCell>
                <TableCell>
                  {signal.latitude && signal.longitude 
                    ? `${signal.latitude}, ${signal.longitude}` 
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}