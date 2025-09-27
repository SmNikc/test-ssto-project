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
  Button,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmailIcon from '@mui/icons-material/Email';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

interface Report {
  id: number;
  request_id: number;
  vessel_name: string;
  mmsi: string;
  report_type: string;
  created_at: string;
  status: string;
  file_path?: string;
  sent_at?: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportId: number, fileName: string) => {
    try {
      const response = await fetch(`http://localhost:3001/reports/${reportId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || `report_${reportId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const handleSendEmail = async (reportId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/reports/${reportId}/send`, {
        method: 'POST'
      });
      if (response.ok) {
        alert('Отчет успешно отправлен');
        fetchReports(); // Обновить список
      }
    } catch (error) {
      console.error('Error sending report:', error);
    }
  };

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'TEST_CONFIRMATION': 'Подтверждение теста',
      'TEST_SUMMARY': 'Сводка по тестам',
      'MONTHLY_REPORT': 'Месячный отчет',
      'INCIDENT_REPORT': 'Отчет об инциденте'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GENERATED': return 'success';
      case 'SENT': return 'primary';
      case 'PENDING': return 'warning';
      case 'ERROR': return 'error';
      default: return 'default';
    }
  };

  // Фильтрация отчетов
  let filteredReports = reports;
  
  if (filter) {
    filteredReports = filteredReports.filter(report =>
      report.vessel_name.toLowerCase().includes(filter.toLowerCase()) ||
      report.mmsi.includes(filter)
    );
  }
  
  if (typeFilter !== 'ALL') {
    filteredReports = filteredReports.filter(report => report.report_type === typeFilter);
  }
  
  if (statusFilter !== 'ALL') {
    filteredReports = filteredReports.filter(report => report.status === statusFilter);
  }

  // Статистика
  const stats = {
    total: reports.length,
    generated: reports.filter(r => r.status === 'GENERATED').length,
    sent: reports.filter(r => r.status === 'SENT').length,
    thisMonth: reports.filter(r => {
      const reportDate = new Date(r.created_at);
      const now = new Date();
      return reportDate.getMonth() === now.getMonth() && 
             reportDate.getFullYear() === now.getFullYear();
    }).length
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Отчеты и документы
      </Typography>

      {/* Статистика */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Всего отчетов
              </Typography>
              <Typography variant="h5">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Сформировано
              </Typography>
              <Typography variant="h5" color="success.main">
                {stats.generated}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Отправлено
              </Typography>
              <Typography variant="h5" color="primary">
                {stats.sent}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                В этом месяце
              </Typography>
              <Typography variant="h5">
                {stats.thisMonth}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Фильтры */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Поиск по судну или MMSI"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Тип отчета</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Тип отчета"
              >
                <MenuItem value="ALL">Все типы</MenuItem>
                <MenuItem value="TEST_CONFIRMATION">Подтверждения</MenuItem>
                <MenuItem value="TEST_SUMMARY">Сводки</MenuItem>
                <MenuItem value="MONTHLY_REPORT">Месячные</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Статус</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Статус"
              >
                <MenuItem value="ALL">Все статусы</MenuItem>
                <MenuItem value="GENERATED">Сформирован</MenuItem>
                <MenuItem value="SENT">Отправлен</MenuItem>
                <MenuItem value="PENDING">В обработке</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={fetchReports}
            >
              Обновить
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Таблица отчетов */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>№</TableCell>
              <TableCell>Судно</TableCell>
              <TableCell>MMSI</TableCell>
              <TableCell>Тип отчета</TableCell>
              <TableCell>Дата создания</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Отправлен</TableCell>
              <TableCell align="center">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredReports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{report.id}</TableCell>
                <TableCell>{report.vessel_name}</TableCell>
                <TableCell>{report.mmsi}</TableCell>
                <TableCell>{getReportTypeLabel(report.report_type)}</TableCell>
                <TableCell>{new Date(report.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <Chip 
                    label={report.status} 
                    color={getStatusColor(report.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {report.sent_at ? new Date(report.sent_at).toLocaleString() : '-'}
                </TableCell>
                <TableCell align="center">
                  <IconButton 
                    size="small" 
                    title="Просмотр"
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    title="Скачать PDF"
                    onClick={() => handleDownload(report.id, `${report.vessel_name}_${report.id}.pdf`)}
                  >
                    <PictureAsPdfIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    title="Отправить по email"
                    onClick={() => handleSendEmail(report.id)}
                    disabled={report.status === 'SENT'}
                  >
                    <EmailIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {loading && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography>Загрузка отчетов...</Typography>
        </Box>
      )}

      {!loading && filteredReports.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography>Отчеты не найдены</Typography>
        </Box>
      )}
    </Box>
  );
}