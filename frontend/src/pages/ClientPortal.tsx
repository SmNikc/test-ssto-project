import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Grid, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import BackendService from '../services/BackendService';
import { useAuth } from '../contexts/AuthContext';

const ClientPortal = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [terminals, setTerminals] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const reqData = await BackendService.getRequests();
      const clientRequests = reqData.filter(r => r.owner_organization === user.organization_name);
      setRequests(clientRequests);
      
      const termData = await BackendService.getTerminals();
      const clientTerminals = termData.filter(t => t.owner_organization === user.organization_name);
      setTerminals(clientTerminals);
    };
    
    if (user) {
      loadData();
    }
  }, [user]);

  const handleNewRequest = async () => {
    // Открыть форму создания заявки
    console.log('Открытие формы новой заявки');
  };

  const requestColumns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'terminal_number', headerName: 'Номер стойки', width: 150 },
    { field: 'vessel_name', headerName: 'Судно', width: 200 },
    { field: 'mmsi', headerName: 'MMSI', width: 150 },
    { field: 'planned_test_date', headerName: 'Дата теста', width: 150 },
    { field: 'status', headerName: 'Статус', width: 120 },
  ];

  const terminalColumns = [
    { field: 'terminal_number', headerName: 'Номер стойки', width: 150 },
    { field: 'vessel_name', headerName: 'Судно', width: 200 },
    { field: 'mmsi', headerName: 'MMSI', width: 150 },
    { field: 'last_test', headerName: 'Последний тест', width: 150 },
    { field: 'status', headerName: 'Статус', width: 120 },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Портал судовладельца: {user?.organization_name}
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="h6">Мои заявки</Typography>
              <Button variant="contained" color="primary" onClick={handleNewRequest}>
                Новая заявка
              </Button>
            </Box>
            <DataGrid
              rows={requests}
              columns={requestColumns}
              pageSizeOptions={[5]}
              autoHeight
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>Мои терминалы</Typography>
            <DataGrid
              rows={terminals}
              columns={terminalColumns}
              pageSizeOptions={[5]}
              autoHeight
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClientPortal;