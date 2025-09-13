import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f2f5'
      }}
    >
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Доступ запрещен
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          У вас нет прав для просмотра этой страницы.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleLogout}
        >
          Выйти и войти заново
        </Button>
      </Paper>
    </Box>
  );
};

export default UnauthorizedPage;