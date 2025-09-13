import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TrainingModeContextType {
  isTrainingMode: boolean;
  toggleTrainingMode: () => void;
  mockData: any;
}

const TrainingModeContext = createContext<TrainingModeContextType>({
  isTrainingMode: false,
  toggleTrainingMode: () => {},
  mockData: {}
});

export const useTrainingMode = () => {
  const context = useContext(TrainingModeContext);
  if (!context) {
    throw new Error('useTrainingMode must be used within TrainingModeProvider');
  }
  return context;
};

export const TrainingModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTrainingMode, setIsTrainingMode] = useState(false);

  const toggleTrainingMode = () => {
    setIsTrainingMode(prev => !prev);
  };

  const mockData = isTrainingMode ? {
    requests: [
      { id: 1, terminal_number: '427000001', vessel_name: 'Тестовое судно 1', mmsi: '273123456', imo_number: '1234567', status: 'pending', planned_test_date: '2025-09-15' }
    ],
    signals: [
      { id: 1, signal_number: 'SIG-001', terminal_number: '427000001', mmsi: '273123456', received_at: '2025-09-10T12:00:00Z', signal_type: 'TEST', coordinates: { lat: 55.75, lng: 37.61 }, is_test: true }
    ],
    terminals: [
      { terminal_number: '427000001', vessel_name: 'Тестовое судно 1', mmsi: '273123456', is_active: true }
    ]
  } : {};

  return (
    <TrainingModeContext.Provider value={{ isTrainingMode, toggleTrainingMode, mockData }}>
      {children}
    </TrainingModeContext.Provider>
  );
};