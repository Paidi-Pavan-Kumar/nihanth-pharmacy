import { useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const setThemeOption = (newTheme) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'light' && <Sun size={20} />}
        {theme === 'dark' && <Moon size={20} />}
        {theme === 'system' && <Monitor size={20} />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border dark:border-gray-700">
          <button
            onClick={() => setThemeOption('light')}
            className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Sun size={16} className="mr-2" />
            <span>Light</span>
            {theme === 'light' && <span className="ml-auto">✓</span>}
          </button>
          
          <button
            onClick={() => setThemeOption('dark')}
            className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Moon size={16} className="mr-2" />
            <span>Dark</span>
            {theme === 'dark' && <span className="ml-auto">✓</span>}
          </button>
          
          <button
            onClick={() => setThemeOption('system')}
            className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Monitor size={16} className="mr-2" />
            <span>System</span>
            {theme === 'system' && <span className="ml-auto">✓</span>}
          </button>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher; 