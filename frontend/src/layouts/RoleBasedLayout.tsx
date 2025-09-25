// frontend/src/layouts/RoleBasedLayout.tsx
import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  IconButton,
  Button,
  Divider,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Иконки
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DescriptionIcon from '@mui/icons-material/Description';
import MapIcon from '@mui/icons-material/Map';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';

const drawerWidth = 240;

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
}

const RoleBasedLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Пункты меню для оператора
  const operatorMenuItems: MenuItem[] = [
    { title: 'Панель', path: '/operator', icon: <DashboardIcon /> },
    { title: 'Заявки', path: '/operator/requests', icon: <AssignmentIcon /> },
    { title: 'Сигналы', path: '/operator/signals', icon: <NotificationsIcon /> },
    { title: 'Отчеты', path: '/operator/reports', icon: <DescriptionIcon /> },
    { title: 'Карта', path: '/operator/map', icon: <MapIcon /> }
  ];

  // Пункты меню для клиента
  const clientMenuItems: MenuItem[] = [
    { title: 'Панель', path: '/client', icon: <DashboardIcon /> },
    { title: 'Мои заявки', path: '/client/requests', icon: <AssignmentIcon /> },
    { title: 'Отчеты', path: '/client/reports', icon: <DescriptionIcon /> }
  ];

  // Пункты меню для админа
  const adminMenuItems: MenuItem[] = [
    { title: 'Панель', path: '/admin', icon: <DashboardIcon /> },
    { title: 'Пользователи', path: '/admin/users', icon: <PersonIcon /> },
    { title: 'Настройки', path: '/admin/settings', icon: <SettingsIcon /> },
    ...operatorMenuItems.map(item => ({ 
      ...item, 
      path: item.path.replace('/operator', '/admin') 
    }))
  ];

  // Выбор меню в зависимости от роли
  const getMenuItems = (): MenuItem[] => {
    switch (user?.role) {
      case 'admin':
        return adminMenuItems;
      case 'operator':
        return operatorMenuItems;
      case 'client':
        return clientMenuItems;
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          ССТО
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleMenuClick(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.title} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  const getRoleTitle = () => {
    switch (user?.role) {
      case 'admin':
        return 'Администратор';
      case 'operator':
        return 'Оператор ССТО';
      case 'client':
        return 'Клиент';
      default:
        return 'Пользователь';
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {getRoleTitle()}
          </Typography>

          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.email}
          </Typography>

          <IconButton
            size="large"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <AccountCircleIcon />
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                {user?.full_name || user?.email}
              </Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="caption" color="textSecondary">
                {user?.organization_name}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Выход
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default RoleBasedLayout;