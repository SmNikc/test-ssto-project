import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container,
  Paper
} from '@mui/material';

// Импорт существующих компонентов
import Dashboard from './components/dashboard.component';
import RequestForm from './components/RequestForm';
import TestingForm from './components/testingForm.component';

// Новые компоненты (нужно будет создать)
import RequestList from './components/RequestList';
import SignalMonitor from './components/SignalMonitor';
import ReportsPage from './components/ReportsPage';

// Навигационная панель
function NavigationBar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Поиск-Море ССТО
        </Typography>
        <Button color="inherit" component={Link} to="/">
          Главная
        </Button>
        <Button color="inherit" component={Link} to="/requests">
          Заявки
        </Button>
        <Button color="inherit" component={Link} to="/request">
          Новая заявка
        </Button>
        <Button color="inherit" component={Link} to="/signals">
          Сигналы
        </Button>
        <Button color="inherit" component={Link} to="/testing">
          Тестирование
        </Button>
        <Button color="inherit" component={Link} to="/reports">
          Отчеты
        </Button>
      </Toolbar>
    </AppBar>
  );
}

// Главная страница с сводкой
function HomePage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Система обработки сигналов ССТО
        </Typography>
        
        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Paper sx={{ p: 3, minWidth: 250 }}>
            <Typography variant="h6">Быстрые действия</Typography>
            <Box sx={{ mt: 2 }}>
              <Button 
                fullWidth 
                variant="contained" 
                component={Link} 
                to="/request"
                sx={{ mb: 1 }}
              >
                Создать заявку
              </Button>
              <Button 
                fullWidth 
                variant="outlined" 
                component={Link} 
                to="/signals"
              >
                Мониторинг сигналов
              </Button>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3, minWidth: 250 }}>
            <Typography variant="h6">Статистика</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Активных заявок: 5
            </Typography>
            <Typography variant="body2">
              Обработано сигналов: 127
            </Typography>
            <Typography variant="body2">
              Сформировано отчетов: 42
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}

// Основной компонент приложения
function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Box sx={{ flexGrow: 1 }}>
        <NavigationBar />
        <Container sx={{ mt: 3 }}>
          <Routes>
            {/* Главная страница */}
            <Route path="/" element={<HomePage />} />
            
            {/* Работа с заявками */}
            <Route path="/requests" element={<RequestList />} />
            <Route path="/request" element={<RequestForm />} />
            
            {/* Мониторинг сигналов */}
            <Route path="/signals" element={<SignalMonitor />} />
            
            {/* Тестирование */}
            <Route path="/testing" element={<TestingForm />} />
            
            {/* Отчеты */}
            <Route path="/reports" element={<ReportsPage />} />
            
            {/* Dashboard (legacy) */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Редирект для неизвестных маршрутов */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  );
}

// Точка входа приложения
const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}

export default App;