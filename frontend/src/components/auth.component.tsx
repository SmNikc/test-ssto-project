<<<<<<< HEAD
import config from '../config';
import React, { useState } from 'react';
import { TextField, Button, Box, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';

const AuthComponent: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8080/auth/realms/test-ssto/protocol/openid-connect/token', {
        grant_type: 'password',
        client_id: process.env.KEYCLOAK_CLIENT_ID,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
        username: email,
        password: password,
      });

      const token = response.data.access_token;
      localStorage.setItem('token', token);
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

=======
CopyEdit
import React, { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import axios from 'axios';
import config from '../config';
const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${config.API_BASE_URL}/api/auth/login`, { email, password });
      window.location.href = '/';
    } catch {
      alert('Ошибка авторизации');
    }
  };
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 3 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Вход в систему
      </Typography>
<<<<<<< HEAD
      <form onSubmit={handleLogin}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
          required
=======
      <form onSubmit={handleSubmit}>
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={email}
          onChange={e => setEmail(e.target.value)}
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
        />
        <TextField
          label="Пароль"
          type="password"
          fullWidth
<<<<<<< HEAD
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 2 }}
          required
        />
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Войти'}
=======
          margin="normal"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <Button type="submit" variant="contained" color="primary" fullWidth>
          Войти
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
        </Button>
      </form>
    </Box>
  );
};
<<<<<<< HEAD

export default AuthComponent;
=======
export default Auth;
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
