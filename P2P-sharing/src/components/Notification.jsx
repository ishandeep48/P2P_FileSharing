import React, { useEffect, useState } from 'react';
import { useP2P } from '../context/P2PContext';

const Notification = () => {
  const { notification: notif, setNotification } = useP2P();
  const [isVisible, setIsVisible] = useState(true);
  const message = notif?.message || '';
  const type = notif?.type || 'info';
  const duration = 5000;

  const typeStyles = {
    success: 'bg-green-500/20 border-green-500/30 text-green-200',
    error: 'bg-red-500/20 border-red-500/30 text-red-200',
    warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200',
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-200'
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setNotification(null);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setNotification(null);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg border backdrop-blur-sm shadow-lg transition-all duration-300 ${typeStyles[type]}`}>
      <div className="flex items-center space-x-3">
        <span className="text-lg">{icons[type]}</span>
        <p className="font-medium">{message}</p>
        <button
          onClick={handleClose}
          className="ml-2 text-white/70 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Notification;
