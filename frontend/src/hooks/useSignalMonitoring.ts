import { useEffect, useState } from 'react';
import BackendService from '../services/BackendService';

export const useSignalMonitoring = () => {
  const [newSignals, setNewSignals] = useState<any[]>([]);

  useEffect(() => {
    const socket = BackendService.initWebSocket((signal) => {
      setNewSignals(prev => [...prev, signal]);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return newSignals;
};