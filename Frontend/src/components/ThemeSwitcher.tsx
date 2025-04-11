// // src/components/ThemeSwitcher.tsx
// import React from 'react';
// import { useTheme } from '../context/ThemeContext';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
// import './ThemeSwitcher.css';

// const ThemeSwitcher: React.FC = () => {
//   const { themeMode, setThemeMode, isDarkMode } = useTheme();

//   const toggleTheme = () => {
//     setThemeMode(isDarkMode ? 'light' : 'dark');
//   };

//   return (
//     <button 
//       className="theme-switcher-btn" 
//       onClick={toggleTheme}
//       title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
//     >
//       <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} />
//     </button>
//   );
// };

// export default ThemeSwitcher;