// frontend/src/components/EnhancedSignalList.tsx
// Улучшенный компонент для отображения сигналов ССТО с приоритетами

import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Box,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

interface Signal {
  id: number;
  mmsi: string;
  vessel_name?: string;
  signal_time: string;
  coordinates: string;
  signal_type: 'TEST_WITH_REQUEST' | 'TEST_WITHOUT_REQUEST' | 'REAL_ALERT' | 'UNKNOWN';
  status: 'NEW' | 'PROCESSING' | 'CONFIRMED' | 'FALSE_ALARM';
  request_id?: number;
  source: string;
  notes?: string;
}

export default function EnhancedSignalList() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Демо данные для показа
  useEffect(() => {
    const demoSignals: Signal[] = [
      {
        id: 1,
        mmsi: '273456789',
        vessel_name: 'Капитан Иванов',
        signal_time: '10:03:25',
        coordinates: '44°39\'N 037°46\'E',
        signal_type: 'TEST_WITH_REQUEST',
        status: 'CONFIRMED',
        request_id: 1,
        source: 'INMARSAT-C',
        notes: 'Плановое тестирование по заявке'
      },
      {
        id: 2,
        mmsi: '273999888',
        vessel_name: 'Неизвестное судно',
        signal_time: '11:45:12',
        coordinates: '55°45\'N 037°37\'E',
        signal_type: 'TEST_WITHOUT_REQUEST',
        status: 'PROCESSING',
        source: 'IRIDIUM',
        notes: 'Внеплановый тест, заявка не найдена'
      },
      {
        id: 3,
        mmsi: '273111222',
        vessel_name: 'Арктика',
        signal_time: '12:15:33',
        coordinates: '69°04\'N 033°05\'E',
        signal_type: 'REAL_ALERT',
        status: 'NEW',
        source: 'COSPAS-SARSAT',
        notes: 'РЕАЛЬНАЯ ТРЕВОГА! Требуется немедленная реакция!'
      },
      {
        id: 4,
        mmsi: '273777666',
        signal_time: '13:20:45',
        coordinates: '43°35\'N 039°43\'E',
        signal_type: 'UNKNOWN',
        status: 'NEW',
        source: 'SafetyNET',
        notes: 'Неопознанный сигнал'
      }
    ];
    setSignals(demoSignals);

    // Проверяем наличие реальных тревог
    const hasRealAlert = demoSignals.some(s => s.signal_type === 'REAL_ALERT' && s.status === 'NEW');
    if (hasRealAlert && soundEnabled) {
      playAlarmSound();
    }
  }, []);

  // Воспроизведение звука тревоги
  const playAlarmSound = () => {
    if (!audioRef.current) {
      // Создаем простой звуковой сигнал используя Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Имитация сирены
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5);
      oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
      
      // Повторяем 3 раза
      setTimeout(() => {
        if (soundEnabled) playAlarmSound();
      }, 1500);
    }
  };

  // Получение цвета строки по типу сигнала
  const getRowColor = (signal: Signal) => {
    switch (signal.signal_type) {
      case 'REAL_ALERT':
        return '#ffebee'; // Красный фон для реальной тревоги
      case 'TEST_WITH_REQUEST':
        return '#e8f5e9'; // Зеленый фон для тестов по заявке
      case 'TEST_WITHOUT_REQUEST':
        return '#fff3e0'; // Оранжевый фон для тестов без заявки
      case 'UNKNOWN':
        return '#fafafa'; // Серый фон для неопознанных
      default:
        return 'white';
    }
  };

  // Получение иконки по типу
  const getTypeIcon = (type: Signal['signal_type']): JSX.Element => {
    switch (type) {
      case 'REAL_ALERT':
        return <ErrorIcon color="error" />;
      case 'TEST_WITH_REQUEST':
        return <CheckCircleIcon color="success" />;
      case 'TEST_WITHOUT_REQUEST':
        return <WarningIcon color="warning" />;
      case 'UNKNOWN':
      default:
        return <InfoIcon color="action" />;
    }
  };

  // Получение текста типа сигнала
  const getSignalTypeText = (type: string) => {
    switch (type) {
      case 'REAL_ALERT':
        return 'РЕАЛЬНАЯ ТРЕВОГА';
      case 'TEST_WITH_REQUEST':
        return 'Тест по заявке';
      case 'TEST_WITHOUT_REQUEST':
        return 'Тест без заявки';
      case 'UNKNOWN':
        return 'Неопознанный';
      default:
        return type;
    }
  };

  // Получение цвета чипа статуса
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'error';
      case 'PROCESSING':
        return 'warning';
      case 'CONFIRMED':
        return 'success';
      case 'FALSE_ALARM':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Панель управления */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Мониторинг сигналов ССТО</Typography>
        <Tooltip title={soundEnabled ? "Выключить звук тревоги" : "Включить звук тревоги"}>
          <IconButton onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Легенда */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Alert severity="success" sx={{ py: 0 }}>
          <strong>Зеленый</strong> - Тест по заявке
        </Alert>
        <Alert severity="warning" sx={{ py: 0 }}>
          <strong>Оранжевый</strong> - Тест без заявки
        </Alert>
        <Alert severity="error" sx={{ py: 0 }}>
          <strong>Красный</strong> - РЕАЛЬНАЯ ТРЕВОГА
        </Alert>
        <Alert severity="info" sx={{ py: 0 }}>
          <strong>Серый</strong> - Неопознанный
        </Alert>
      </Box>

      {/* Предупреждение о реальной тревоге */}
      {signals.some(s => s.signal_type === 'REAL_ALERT' && s.status === 'NEW') && (
        <Alert 
          severity="error" 
          sx={{ mb: 2, fontSize: '1.2rem', animation: 'pulse 1s infinite' }}
          icon={<ErrorIcon sx={{ fontSize: '2rem' }} />}
        >
          <strong>ВНИМАНИЕ! ПОЛУЧЕН РЕАЛЬНЫЙ СИГНАЛ БЕДСТВИЯ!</strong>
          <br />
          Требуется немедленная реакция дежурного ГМСКЦ
        </Alert>
      )}

      {/* Таблица сигналов */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Тип</TableCell>
              <TableCell>MMSI</TableCell>
              <TableCell>Судно</TableCell>
              <TableCell>Время</TableCell>
              <TableCell>Координаты</TableCell>
              <TableCell>Источник</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Заявка</TableCell>
              <TableCell>Примечания</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {signals
              .sort((a, b) => {
                // Сортировка: реальные тревоги сверху
                if (a.signal_type === 'REAL_ALERT') return -1;
                if (b.signal_type === 'REAL_ALERT') return 1;
                return 0;
              })
              .map((signal) => (
                <TableRow 
                  key={signal.id}
                  sx={{ 
                    backgroundColor: getRowColor(signal),
                    animation: signal.signal_type === 'REAL_ALERT' && signal.status === 'NEW' 
                      ? 'blink 1s infinite' 
                      : 'none'
                  }}
                >
                  <TableCell>
                    <Tooltip title={getSignalTypeText(signal.signal_type)}>
                      {getTypeIcon(signal.signal_type)}
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <strong>{signal.mmsi}</strong>
                  </TableCell>
                  <TableCell>{signal.vessel_name || 'Не определено'}</TableCell>
                  <TableCell>{signal.signal_time}</TableCell>
                  <TableCell>{signal.coordinates}</TableCell>
                  <TableCell>{signal.source}</TableCell>
                  <TableCell>
                    <Chip 
                      label={signal.status}
                      color={getStatusColor(signal.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {signal.request_id ? (
                      <Chip label={`№${signal.request_id}`} size="small" color="primary" />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Нет заявки
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {signal.notes}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* CSS анимации */}
      <style>{`
        @keyframes blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.5; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </Box>
  );
}