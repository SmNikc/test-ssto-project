import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Grid, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { BackendService } from '../services/BackendService';
import { useAuth } from '../contexts/AuthContext';

type RequestItem = {
  id: number | string;
  owner_organization?: string;
  [key: string]: unknown;
};

type TerminalItem = {
  terminal_number?: string;
  owner_organization?: string;
  [key: string]: unknown;
};

function normalizeList<T extends Record<string, unknown>>(input: unknown): T[] {
  if (Array.isArray(input)) return input as T[];
  if (input && typeof input === 'object') {
    const maybeData = (input as { data?: unknown }).data;
    if (Array.isArray(maybeData)) return maybeData as T[];
  }
  return [];
}

const ClientPortal = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [terminals, setTerminals] = useState<TerminalItem[]>([]);

  useEffect(() => {
    if (!user) {
      setRequests([]);
      setTerminals([]);
      return;
    }

    const loadData = async () => {
      try {
        const [reqRaw, termRaw] = await Promise.all([
          BackendService.getRequests(),
          BackendService.getTerminals(),
        ]);

        const organization = user.organization_name ?? '';
        const allRequests = normalizeList<RequestItem>(reqRaw);
        const allTerminals = normalizeList<TerminalItem>(termRaw);

        const byOrganization = (item: { owner_organization?: string }) =>
          organization ? item.owner_organization === organization : true;

        setRequests(allRequests.filter(byOrganization));
        setTerminals(allTerminals.filter(byOrganization));
      } catch (error) {
        console.error('Ошибка загрузки данных клиента', error);
        setRequests([]);
        setTerminals([]);
      }
    };

    loadData();
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