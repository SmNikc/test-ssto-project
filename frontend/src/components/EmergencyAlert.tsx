import React, { useEffect, useState } from 'react';
import { Alert, Box } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface EmergencyAlertProps {
  signal: any;
}

const EmergencyAlert = ({ signal }: EmergencyAlertProps) => {
  const [isFlashing, setIsFlashing] = useState(false);
  
  useEffect(() => {
    // Определение реального тревожного сигнала
    const isEmergency = signal.signal_type === 'DISTRESS' || 
                        signal.signal_type === 'EMERGENCY' ||
                        signal.signal_type === 'REAL_ALERT' ||
                        !signal.request_id ||
                        signal.metadata?.emergency === true ||
                        signal.metadata?.test_mode === false;
    
    if (isEmergency) {
      // Запуск мигания
      setIsFlashing(true);
      
      // Троекратный звуковой сигнал
      playEmergencySound();
      
      // Добавить в журнал критических событий
      logCriticalEvent(signal);
      
      // Уведомление персонала
      notifyPersonnel(signal);
      
      // Активация протокола тревоги
      activateEmergencyProtocol();
    }
  }, [signal]);
  
  const playEmergencySound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Троекратный короткий сигнал
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Частота сирены (высокий тон для привлечения внимания)
        oscillator.frequency.value = 1000; // Гц
        oscillator.type = 'square';
        
        // Громкость
        gainNode.gain.value = 0.3;
        
        // Длительность каждого сигнала - 200мс
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      }, i * 400); // Интервал между сигналами
    }
  };
  
  const logCriticalEvent = (signal: any) => {
    console.log('Критическое событие:', signal);
    // Здесь можно добавить запись в backend или local storage
    fetch('/api/logs/critical', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        type: 'emergency',
        signal_id: signal.id,
        timestamp: new Date().toISOString(),
        user_id: localStorage.getItem('user_id')
      })
    }).catch(error => console.error('Error logging event:', error));
  };
  
  const notifyPersonnel = (signal: any) => {
    // Push-уведомление (используя service worker или websocket)
    if ('vibrate' in navigator) {
      // @ts-ignore — тип Navigator не содержит vibrate в стандартной декларации
      navigator.vibrate([200, 100, 200]);
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('ЭКСТРЕННАЯ ТРЕВОГА ССТО', {
          body: `Реальное срабатывание на судне ${signal.vessel_name}. Координаты: ${signal.coordinates.lat}, ${signal.coordinates.lng}`,
          icon: '/icons/emergency.png',
          tag: 'emergency-alert',
          data: { signalId: signal.id }
        });
      });
    }
    
    // Email и SMS - через backend
    fetch('/api/notifications/emergency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(signal)
    }).catch(error => console.error('Error sending notifications:', error));
  };
  
  const activateEmergencyProtocol = () => {
    // Переключение интерфейса в режим тревоги
    document.body.classList.add('emergency-mode');
    
    // Блокировка несущественных функций
    const nonEssentialButtons = document.querySelectorAll('button:not(.emergency-action)');
    nonEssentialButtons.forEach(btn => {
      (btn as HTMLButtonElement).disabled = true;
    });
    
    // Фокус на обработке
    const emergencyPanel = document.getElementById('emergency-panel');
    if (emergencyPanel) {
      emergencyPanel.style.display = 'block';
    }
  };
  
  return (
    <Box
      sx={{
        animation: isFlashing ? 'emergencyFlash 0.5s infinite' : 'none',
        '@keyframes emergencyFlash': {
          '0%': { backgroundColor: '#ff0000', boxShadow: '0 0 20px #ff0000' },
          '50%': { backgroundColor: '#ff6666', boxShadow: '0 0 40px #ff0000' },
          '100%': { backgroundColor: '#ff0000', boxShadow: '0 0 20px #ff0000' }
        }
      }}
    >
      <Alert 
        severity="error"
        icon={<WarningAmberIcon sx={{ fontSize: 40 }} />}
        sx={{
          fontSize: '1.2rem',
          '& .MuiAlert-message': {
            fontWeight: 'bold'
          }
        }}
      >
        ТРЕВОГА! Реальное срабатывание ССТО на судне {signal.vessel_name}!
      </Alert>
    </Box>
  );
};

export default EmergencyAlert;