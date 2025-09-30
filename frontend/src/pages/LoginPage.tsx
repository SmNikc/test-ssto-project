import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff, Person, Lock } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, error, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      // Error handled in context
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative'
      }}
    >
      <Paper 
        elevation={10}
        sx={{ 
          p: 5, 
          width: { xs: '90%', sm: 450 },
          borderRadius: 3,
          position: 'relative',
          overflow: 'visible',
          mt: 8
        }}
      >
        {/* Эмблема Морспасслужбы */}
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120,
            height: 120,
            borderRadius: '50%',
            backgroundColor: '#fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 1.5
          }}
        >
          {/* Временный текст вместо изображения */}
          <Box
            sx={{
              textAlign: 'center',
              color: '#1976d2',
              fontWeight: 'bold',
              fontSize: '14px',
              lineHeight: 1.2
            }}
          >
            ФГБУ<br/>
            МОРСКАЯ<br/>
            СПАСАТЕЛЬНАЯ<br/>
            СЛУЖБА
          </Box>
        </Box>

        {/* Заголовки */}
        <Box sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              color: '#333',
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            Система ССТО
          </Typography>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: '#666',
              fontSize: '0.95rem'
            }}
          >
            Судовая система тревожного оповещения
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#999',
              display: 'block',
              mt: 1
            }}
          >
            ФГБУ "Морская спасательная служба"
          </Typography>
        </Box>
        
        {/* Сообщение об ошибке */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2
            }}
          >
            {error}
          </Alert>
        )}
        
        {/* Форма входа */}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email или логин"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            autoComplete="username"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: '#999' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          <TextField
            fullWidth
            label="Пароль"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            autoComplete="current-password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: '#999' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          
          {/* Информация о режиме */}
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              textAlign: 'center',
              color: '#666',
              mt: 2,
              mb: 1,
              fontStyle: 'italic'
            }}
          >
            Упрощенный режим входа — введите любой пароль
          </Typography>

          {/* Кнопка входа */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            size="large"
            sx={{ 
              mt: 2,
              py: 1.5,
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #2196F3 90%)',
              }
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                <span>Вход...</span>
              </Box>
            ) : (
              'Войти в систему'
            )}
          </Button>
        </form>

        {/* Примеры логинов */}
        <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
            Тестовые учетные записи:
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
            📊 Оператор: <strong>operator@test.com</strong>
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
            🚢 Клиент: <strong>client@test.com</strong>
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
            ⚙️ Админ: <strong>admin@test.com</strong>
          </Typography>
        </Box>

        {/* Футер */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee', textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#999' }}>
            © 2025 ФГБУ "Морская спасательная служба"<br/>
            Все права защищены
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
