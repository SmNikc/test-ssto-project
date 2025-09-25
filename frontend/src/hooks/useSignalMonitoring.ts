import { useEffect, useState, useCallback, useRef } from 'react';
import BackendService from '../services/BackendService';
import { Socket } from 'socket.io-client';

// Типизация сигнала
interface Signal {
  id: string;
  terminal_number: string;
  vessel_name?: string;
  mmsi?: string;
  signal_type: 'TEST' | 'ALERT' | 'DISTRESS' | 'REAL_ALERT';
  received_at: string;
  is_test: boolean;
  coordinates?: { lat: number; lng: number };
  status?: 'new' | 'active' | 'processed' | 'archived';
  request_id?: string;
  metadata?: Record<string, any>;
}

interface SignalMonitoringState {
  signals: Signal[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  error: string | null;
  lastUpdate: Date | null;
}

interface UseSignalMonitoringOptions {
  maxSignals?: number; // Максимальное количество сохраняемых сигналов
  autoReconnect?: boolean; // Автоматическое переподключение
  reconnectDelay?: number; // Задержка перед переподключением (мс)
}

export const useSignalMonitoring = (options: UseSignalMonitoringOptions = {}) => {
  const {
    maxSignals = 100,
    autoReconnect = true,
    reconnectDelay = 3000
  } = options;

  const [state, setState] = useState<SignalMonitoringState>({
    signals: [],
    connectionStatus: 'disconnected',
    error: null,
    lastUpdate: null
  });

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Функция подключения к WebSocket
  const connect = useCallback(() => {
    try {
      setState(prev => ({ ...prev, connectionStatus: 'connecting', error: null }));

      const socket = BackendService.initWebSocket((signal: Signal) => {
        setState(prev => ({
          ...prev,
          signals: [signal, ...prev.signals].slice(0, maxSignals),
          lastUpdate: new Date()
        }));
      });

      // Обработчики событий сокета
      socket.on('connect', () => {
        console.log('✅ WebSocket подключен');
        setState(prev => ({ ...prev, connectionStatus: 'connected', error: null }));
      });

      socket.on('disconnect', (reason: string) => {
        console.log('❌ WebSocket отключен:', reason);
        setState(prev => ({ ...prev, connectionStatus: 'disconnected' }));

        // Автоматическое переподключение
        if (autoReconnect && reason !== 'io client disconnect') {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Попытка переподключения...');
            connect();
          }, reconnectDelay);
        }
      });

      socket.on('connect_error', (error: Error) => {
        console.error('❌ Ошибка подключения:', error.message);
        setState(prev => ({ 
          ...prev, 
          connectionStatus: 'error', 
          error: error.message 
        }));
      });

      socketRef.current = socket;
      return socket;
    } catch (error) {
      console.error('Ошибка инициализации WebSocket:', error);
      setState(prev => ({ 
        ...prev, 
        connectionStatus: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
      return null;
    }
  }, [maxSignals, autoReconnect, reconnectDelay]);

  // Функция отключения
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
  }, []);

  // Функция очистки сигналов
  const clearSignals = useCallback(() => {
    setState(prev => ({ ...prev, signals: [] }));
  }, []);

  // Функция добавления тестового сигнала (для отладки)
  const addTestSignal = useCallback(() => {
    const testSignal: Signal = {
      id: `TEST-${Date.now()}`,
      terminal_number: 'TEST-TERMINAL',
      vessel_name: 'Тестовое судно',
      mmsi: '123456789',
      signal_type: 'TEST',
      received_at: new Date().toISOString(),
      is_test: true,
      coordinates: { lat: 55.75, lng: 37.61 },
      status: 'new'
    };
    
    setState(prev => ({
      ...prev,
      signals: [testSignal, ...prev.signals].slice(0, maxSignals),
      lastUpdate: new Date()
    }));
  }, [maxSignals]);

  // Эффект для подключения при монтировании
  useEffect(() => {
    const socket = connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.disconnect();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // Состояние
    signals: state.signals,
    connectionStatus: state.connectionStatus,
    error: state.error,
    lastUpdate: state.lastUpdate,
    isConnected: state.connectionStatus === 'connected',
    
    // Методы
    connect,
    disconnect,
    clearSignals,
    addTestSignal,
    
    // Статистика
    stats: {
      total: state.signals.length,
      test: state.signals.filter(s => s.is_test).length,
      real: state.signals.filter(s => !s.is_test).length,
      emergency: state.signals.filter(s => 
        s.signal_type === 'DISTRESS' || s.signal_type === 'REAL_ALERT'
      ).length
    }
  };
};