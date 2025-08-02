import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Description as ContractIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

const DRAWER_WIDTH = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // ナビゲーションメニューの定義
  const navigationItems = [
    {
      text: t('navigation.dashboard'),
      icon: <DashboardIcon />,
      path: '/dashboard'
    },
    {
      text: t('navigation.contracts'),
      icon: <ContractIcon />,
      path: '/contracts'
    },
    {
      text: t('navigation.newContract'),
      icon: <AddIcon />,
      path: '/contracts/new'
    }
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleProfileMenuClose();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // サイドバーの内容
  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          契約管理システム
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={isActive(item.path)}
              onClick={() => handleNavigation(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main + '20',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main + '30',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.path) ? theme.palette.primary.main : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: isActive(item.path) ? 600 : 400,
                    color: isActive(item.path) ? theme.palette.primary.main : 'inherit',
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation('/settings')}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary={t('navigation.settings')} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* アプリバー */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ 
              flexGrow: 1,
              display: { xs: 'none', md: 'block' }
            }}
          >
            契約管理システム
          </Typography>

          {/* 右側のアクション */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* 通知アイコン */}
            <IconButton color="inherit">
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* 言語切り替え */}
            <LanguageSwitcher />

            {/* ユーザーメニュー */}
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar
                sx={{ width: 32, height: 32 }}
                src={user?.photoURL || undefined}
              >
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || <AccountIcon />}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* プロフィールメニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <AccountIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2">
              {user?.displayName || user?.email}
            </Typography>
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleNavigation('/settings'); handleProfileMenuClose(); }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('navigation.settings')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('navigation.logout')}</ListItemText>
        </MenuItem>
      </Menu>

      {/* サイドバー */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* モバイル用一時的ドロワー */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // モバイルでの性能向上
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* デスクトップ用永続ドロワー */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* メインコンテンツ */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px', // AppBarの高さ分のマージン
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: theme.palette.background.default,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;