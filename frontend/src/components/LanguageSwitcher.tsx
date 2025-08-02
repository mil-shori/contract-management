import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useI18n, type SupportedLanguage } from '../contexts/I18nContext';
import { toast } from 'react-toastify';

interface LanguageSwitcherProps {
  variant?: 'icon' | 'menu';
  showLabel?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'icon',
  showLabel = false
}) => {
  const { t } = useTranslation();
  const { 
    currentLanguage, 
    languages, 
    changeLanguage, 
    isChangingLanguage 
  } = useI18n();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = async (languageCode: SupportedLanguage) => {
    try {
      await changeLanguage(languageCode);
      toast.success(t('settings.languageChanged'));
      handleClose();
    } catch (error) {
      console.error('Failed to change language:', error);
      toast.error(t('common.error'));
    }
  };

  const currentLanguageData = languages.find(lang => lang.code === currentLanguage);

  if (variant === 'menu') {
    return (
      <>
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={language.code === currentLanguage}
            disabled={isChangingLanguage}
          >
            <ListItemIcon>
              {language.code === currentLanguage && (
                <CheckIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText 
              primary={language.nativeName}
              secondary={showLabel ? language.name : undefined}
            />
            {isChangingLanguage && language.code === currentLanguage && (
              <CircularProgress size={16} sx={{ ml: 1 }} />
            )}
          </MenuItem>
        ))}
      </>
    );
  }

  return (
    <>
      <Tooltip title={t('settings.changeLanguage')}>
        <IconButton
          onClick={handleClick}
          disabled={isChangingLanguage}
          color="inherit"
          aria-label={t('settings.changeLanguage')}
          aria-controls={open ? 'language-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          {isChangingLanguage ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            <LanguageIcon />
          )}
        </IconButton>
      </Tooltip>
      
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 180,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
            },
          },
        }}
      >
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={language.code === currentLanguage}
            disabled={isChangingLanguage}
          >
            <ListItemIcon>
              {language.code === currentLanguage && (
                <CheckIcon fontSize="small" color="primary" />
              )}
            </ListItemIcon>
            <ListItemText 
              primary={language.nativeName}
              secondary={showLabel ? language.name : undefined}
              primaryTypographyProps={{
                fontWeight: language.code === currentLanguage ? 600 : 400
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSwitcher;