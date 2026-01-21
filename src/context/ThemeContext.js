import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ThemeContext = createContext();

// رنگ‌های Light Theme
const lightColors = {
  primary: '#FF5722',
  primaryDark: '#E64A19',
  background: '#ffffff',
  surface: '#f5f7fa',
  text: '#333333',
  textSecondary: '#666666',
  textLight: '#999999',
  border: '#e0e0e0',
  card: '#ffffff',
  error: '#e74c3c',
  success: '#27ae60',
  warning: '#f39c12',
  info: '#3498db',
};

// رنگ‌های Dark Theme
const darkColors = {
  primary: '#FF5722',
  primaryDark: '#E64A19',
  background: '#121212',
  surface: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#b3b3b3',
  textLight: '#808080',
  border: '#333333',
  card: '#1e1e1e',
  error: '#e74c3c',
  success: '#27ae60',
  warning: '#f39c12',
  info: '#3498db',
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState('light'); // 'light', 'dark', 'system'
  const [isDark, setIsDark] = useState(false);
  const [colors, setColors] = useState(lightColors);

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    updateTheme();
  }, [theme, systemColorScheme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await SecureStore.getItemAsync('theme');
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        setTheme('system');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      setTheme('system');
    }
  };

  const updateTheme = () => {
    let shouldUseDark = false;
    
    if (theme === 'dark') {
      shouldUseDark = true;
    } else if (theme === 'light') {
      shouldUseDark = false;
    } else if (theme === 'system') {
      shouldUseDark = systemColorScheme === 'dark';
    }

    setIsDark(shouldUseDark);
    setColors(shouldUseDark ? darkColors : lightColors);
  };

  const changeTheme = async (newTheme) => {
    try {
      await SecureStore.setItemAsync('theme', newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
