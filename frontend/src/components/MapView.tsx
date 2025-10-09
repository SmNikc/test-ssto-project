// frontend/src/components/MapView.tsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Alert, Chip, CircularProgress } from '@mui/material';
import MarineMap from './MarineMap';

const MapView = () => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    try {
      const response = await fetch('/api/signals', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSignals(data || []);
      }
    } catch (error) {
      console.error('Error loading signals:', error);
      setSignals([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatistics = () => {
    const withCoords = signals.filter((s: any) => s.coordinates).length;
    const distress = signals.filter((s: any) => s.signal_type === 'DISTRESS' || s.signal_type === 'REAL_ALERT').length;
    const test = signals.filter((s: any) => s.signal_type === 'TEST' || s.signal_type === 'SSAS_TEST').length;
    return { total: signals.length, withCoords, distress, test };
  };

  const stats = getStatistics();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Карта сигналов ССТО
      </Typography>
      
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip label={`Всего сигналов: ${stats.total}`} />
        <Chip label={`С координатами: ${stats.withCoords}`} color="primary" />
        {stats.distress > 0 && (
          <Chip label={`Тревожных: ${stats.distress}`} color="error" />
        )}
        {stats.test > 0 && (
          <Chip label={`Тестовых: ${stats.test}`} color="info" />
        )}
      </Box>

      {loading ? (
        <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Загрузка сигналов...</Typography>
        </Paper>
      ) : (
        <>
          {stats.withCoords === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Нет сигналов с координатами для отображения на карте. 
              Попробуйте создать тестовый сигнал через раздел "Тестирование".
            </Alert>
          )}
          
          <Paper sx={{ p: 1 }}>
            <MarineMap 
              signals={signals.filter((s: any) => s.coordinates)} 
              center={[37.6173, 55.7558]}
              zoom={5}
            />
          </Paper>
        </>
      )}
    </Box>
  );
};

export default MapView;