"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const isDarkMode = () =>
  typeof window !== "undefined" &&
  document.documentElement.classList.contains("dark");

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(isDarkMode());
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      setDark(false);
      localStorage.setItem("theme", "light");
    } else {
      html.classList.add("dark");
      setDark(true);
      localStorage.setItem("theme", "dark");
    }
  };

  // Read theme preference from localStorage on mount (optional, for persistence)
  useEffect(() => {
    const userTheme = localStorage.getItem("theme");
    if (userTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    } else if (userTheme === "light") {
      document.documentElement.classList.remove("dark");
      setDark(false);
    }
  }, []);

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      className="p-2 rounded-full shadow-md border border-gray-200  dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      onClick={toggleTheme}
    >
      {dark ? (
        <Sun size={18} className="text-yellow-400" />
      ) : (
        <Moon size={18} className="text-white" />
      )}
    </button>
  );
}
