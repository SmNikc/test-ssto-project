<<<<<<< HEAD
import config from '../config';
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, TextField, Select, MenuItem, Button } from '@mui/material';
import axios from 'axios';

interface Signal {
  signal_id: string;
  mmsi: string;
  signal_type: string;
  received_at: string;
  status: string;
}

const Dashboard: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filters, setFilters] = useState({ mmsi: '', signal_type: 'all', startDate: '', endDate: '' });

  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    try {
      const response = await axios.get('${config.API_BASE_URL}/api/signals/type/all', {
        params: {
          startDate: filters.startDate || '2025-01-01',
          endDate: filters.endDate || new Date().toISOString().split('T')[0],
        },
      });
      setSignals(response.data);
    } catch (error) {
      console.error('Ошибка загрузки сигналов:', error);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    fetchSignals();
  };

  return (
    <div>
      <h1>Дашборд сигналов</h1>
      <div style={{ marginBottom: '20px' }}>
        <TextField
          name="mmsi"
          label="MMSI"
          value={filters.mmsi}
          onChange={handleFilterChange}
          style={{ marginRight: '10px' }}
        />
        <Select
          name="signal_type"
          value={filters.signal_type}
          onChange={handleFilterChange}
          style={{ marginRight: '10px' }}
        >
          <MenuItem value="all">Все</MenuItem>
          <MenuItem value="test">Тестовый</MenuItem>
          <MenuItem value="alert">Тревожный</MenuItem>
          <MenuItem value="unscheduled">Внеплановый</MenuItem>
        </Select>
        <TextField
          name="startDate"
          type="date"
          label="Дата начала"
          value={filters.startDate}
          onChange={handleFilterChange}
          style={{ marginRight: '10px' }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          name="endDate"
          type="date"
          label="Дата окончания"
          value={filters.endDate}
          onChange={handleFilterChange}
          style={{ marginRight: '10px' }}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" onClick={applyFilters}>Применить</Button>
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>MMSI</TableCell>
            <TableCell>Тип сигнала</TableCell>
            <TableCell>Время получения</TableCell>
            <TableCell>Статус</TableCell>
            <TableCell>Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {signals.map((signal) => (
            <TableRow key={signal.signal_id}>
              <TableCell>{signal.mmsi}</TableCell>
              <TableCell>{signal.signal_type}</TableCell>
              <TableCell>{signal.received_at}</TableCell>
              <TableCell>{signal.status}</TableCell>
              <TableCell>
                <Button>Изменить</Button>
                <Button>Привязать</Button>
                <Button>Обновить статус</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

=======
CopyEdit
import React, { useState } from 'react';
import { Box, Typography, Button, Grid, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Модуль Тест ССТО — Панель управления
      </Typography>
      <Grid container spacing={2} justifyContent="center">
        <Grid item>
          <Paper sx={{ p: 2, minWidth: 220, textAlign: 'center' }}>
            <Typography variant="h6">Заявки</Typography>
            <Button variant="contained" onClick={() => navigate('/request')}>
              Новая заявка
            </Button>
          </Paper>
        </Grid>
        <Grid item>
          <Paper sx={{ p: 2, minWidth: 220, textAlign: 'center' }}>
            <Typography variant="h6">Тестовые сценарии</Typography>
            <Button variant="contained" onClick={() => navigate('/testing')}>
              Новый сценарий
            </Button>
          </Paper>
        </Grid>
        <Grid item>
          <Paper sx={{ p: 2, minWidth: 220, textAlign: 'center' }}>
            <Typography variant="h6">Карта</Typography>
            <Button variant="contained" onClick={() => navigate('/map')}>
              Перейти к карте
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
export default Dashboard;
