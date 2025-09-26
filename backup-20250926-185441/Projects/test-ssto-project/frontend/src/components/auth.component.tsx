import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Alert, CircularProgress, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Используем login из AuthContext
      await login(email, password);
      
      // После успешного логина AuthContext обновит состояние пользователя
      // и приложение перенаправит на нужную страницу
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка авторизации');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default'
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h4" align="center" gutterBottom>
          Вход в систему ССТО
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            required
            margin="normal"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={isLoading}
            autoComplete="email"
            autoFocus
          />
          <TextField
            label="Пароль"
            type="password"
            fullWidth
            required
            margin="normal"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="current-password"
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth
            disabled={isLoading}
            sx={{ mt: 3, mb: 2, height: 48 }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Войти'}
          </Button>
        </form>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          Тестовые учетные записи:
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          operator1@test.com / password123
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          client1@test.com / password123
        </Typography>
      </Paper>
    </Box>
  );
};

export default Auth;