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
export default Dashboard;
