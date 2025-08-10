import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';

import { Button, Stack } from '@mui/material';

export default function Dashboard() {
  // подчистим предупреждения линтера — префиксуем подчёркиванием
  const [_count, _setCount] = useState(0);
  const navigate = useNavigate();

  return (
    <Stack spacing={2} direction="row">
      <Button variant="contained" onClick={() => navigate('/request')}>
        Новая заявка
      </Button>
      <Button variant="outlined" onClick={() => navigate('/testing')}>
        Тестовый сценарий
      </Button>
    </Stack>
  );
}
