// frontend/src/pages/OperatorDashboard.tsx
import React from 'react';
import { Box, Typography, Button, Grid, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const OperatorDashboard = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Панель оператора ССТО
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Заявки</Typography>
            <Typography>Активных заявок: 0</Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 2 }}
              onClick={() => navigate('/operator/requests')}
            >
              Открыть заявки
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Сигналы</Typography>
            <Typography>Активных сигналов: 0</Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 2 }}
              onClick={() => navigate('/operator/signals')}
            >
              Мониторинг сигналов
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OperatorDashboard;