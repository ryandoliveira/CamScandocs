import React, { useEffect, useState } from 'react';
export default function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    document.body.style.background = dark ? 'linear-gradient(135deg, #1a1a2e, #16213e)' : '#f8f9fa';
    document.body.style.color = dark ? '#d1d1d1' : '#2c2c2c';
  }, [dark]);
  return (
    <button
      className="btn btn-sm btn-secondary position-fixed"
      style={{ top: '1rem', right: '1rem', zIndex: 2000 }}
      onClick={() => setDark(prev => !prev)}
    >{dark ? 'Light Mode' : 'Dark Mode'}</button>
  );
}