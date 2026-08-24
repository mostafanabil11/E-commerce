"use client"
import React, { useEffect, useState, memo } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'

function ThemeSwitcherComponent() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800" />;
  }

  const isDark = theme === 'dark';

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/70 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700" />
      )}
    </motion.button>
  );
}

const ThemeSwitcher = memo(ThemeSwitcherComponent);
export default ThemeSwitcher;
