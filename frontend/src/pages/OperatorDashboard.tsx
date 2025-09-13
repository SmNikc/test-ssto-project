import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import MetricsPanel from '../components/MetricsPanel';
import QuickActionsPanel from '../components/QuickActionsPanel';
import MarineMap from '../components/MarineMap';
import EmergencyAlert from '../components/EmergencyAlert';
import BackendService from '../services/BackendService';
import { useSignalMonitoring } from '../hooks/useSignalMonitoring';

const OperatorDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [signals, setSignals] = useState([]);
  const [emergencySignals, setEmergencySignals] = useState([]);

  const newSignals = useSignalMonitoring();

  useEffect(() => {
    const loadData = async () => {
      const reqData = await BackendService.getRequests();
      setRequests(reqData);
      
      const sigData = await BackendService.getSignals();
      setSignals(sigData);
      
      const emergencies = sigData.filter(sig => 
        sig.signal_type === 'DISTRESS' || 
        sig.signal_type === 'REAL_ALERT' ||
        !sig.request_id ||
        sig.metadata?.emergency === true
      );
      setEmergencySignals(emergencies);
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (newSignals.length > 0) {
      setSignals(prev => [...prev, ...newSignals]);
      
      const newEmergencies = newSignals.filter(sig => 
        sig.signal_type === 'DISTRESS' || 
        sig.signal_type === 'REAL_ALERT' ||
        !sig.request_id ||
        sig.metadata?.emergency === true
      );
      
      if (newEmergencies.length > 0) {
        setEmergencySignals(prev => [...prev, ...newEmergencies]);
      }
    }
  }, [newSignals]);

  const getTodayTests = () => {
    const today = new Date().toISOString().split('T')[0];
    return requests.filter(r => r.planned_test_date === today && r.status === 'approved');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Панель оператора
      </Typography>
      
      {emergencySignals.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, backgroundColor: '#ffcccc' }}>
          <Typography variant="h6" color="error">
            ЭКСТРЕННЫЕ СИГНАЛЫ ({emergencySignals.length})
          </Typography>
          {emergencySignals.map(sig => (
            <EmergencyAlert key={sig.id} signal={sig} />
          ))}
        </Paper>
      )}
      
      <MetricsPanel 
        activeSignals={signals.filter(s => s.status === 'active').length}
        emergencySignals={emergencySignals.length}
        pendingRequests={requests.filter(r => r.status === 'pending').length}
        todayTests={getTodayTests().length}
      />
      
      <QuickActionsPanel />
      
      <Paper sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Морская карта с сигналами
        </Typography>
        <MarineMap signals={signals} />
      </Paper>
    </Box>
  );
};

export default OperatorDashboard;