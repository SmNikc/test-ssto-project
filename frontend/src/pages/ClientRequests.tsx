// frontend/src/pages/ClientRequests.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const ClientRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Заглушка для загрузки данных
    setRequests([]);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Мои заявки
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="body1">
          Судовладелец: {user?.organization_name || 'Не указано'}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {user?.email}
        </Typography>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Номер заявки</TableCell>
              <TableCell>Судно</TableCell>
              <TableCell>MMSI</TableCell>
              <TableCell>Дата теста</TableCell>
              <TableCell>Статус</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.length > 0 ? (
              requests.map((request: any) => (
                <TableRow key={request.id}>
                  <TableCell>{request.request_id}</TableCell>
                  <TableCell>{request.vessel_name}</TableCell>
                  <TableCell>{request.mmsi}</TableCell>
                  <TableCell>{request.test_date}</TableCell>
                  <TableCell>
                    <Chip label={request.status} size="small" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Нет заявок
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ClientRequests;