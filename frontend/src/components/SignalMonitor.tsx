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
  Grid,
  Card,
  CardContent
} from '@mui/material';

interface Signal {
  id: number;
  mmsi: string;
  vessel_name?: string;
  received_at: string;
  status: string;
  latitude?: number;
  longitude?: number;
  request_id?: string;
  metadata?: any;
}

export default function SignalMonitor() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filter, setFilter] = useState('');
  const [stats, setStats] = useState<any>(null);

  const fetchSignals = async () => {
    try {
      const response = await fetch('/api/signals');
      const data = await response.json();
      if (Array.isArray(data)) {
        setSignals(data);
      } else if (data.data && Array.isArray(data.data)) {
        setSignals(data.data);
      } else {
        setSignals([]);
      }
    } catch (error) {
      console.error('Error fetching signals:', error);
      setSignals([]);
    }
  };

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `/api/signals/statistics?startDate=${today}&endDate=${today}`
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
    }, 30000); // обновление каждые 30 сек
    return () => clearInterval(interval);
  }, []);

  const filteredSignals = Array.isArray(signals) 
    ? signals.filter(s => 
        !filter || 
        s.mmsi?.includes(filter) || 
        s.status?.toLowerCase().includes(filter.toLowerCase())
      )
    : [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Мониторинг сигналов ССТО
      </Typography>
      
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">{stats.total || 0}</Typography>
                <Typography variant="body2">Всего сигналов</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">{stats.byStatus?.MATCHED || 0}</Typography>
                <Typography variant="body2">Сопоставлено</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">{stats.byStatus?.ERROR || 0}</Typography>
                <Typography variant="body2">Ошибки</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">{stats.byType?.SSAS_TEST || 0}</Typography>
                <Typography variant="body2">SSAS тестов</Typography>
              </CardContent>
            </Card>
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
            {filteredSignals.length > 0 ? (
              filteredSignals.map((signal) => (
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Сигналы не найдены
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}