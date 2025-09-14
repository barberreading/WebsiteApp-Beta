/**
 * Server Status Indicator
 * Shows real-time server connection status in a non-intrusive way
 */

import React, { useState, useEffect } from 'react';
import { Box, Chip, Tooltip, Fade } from '@mui/material';
import {
  WifiOff as WifiOffIcon,
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import axiosInstance from '../../utils/axiosInstance';
import offlineBookingQueue from '../../utils/offlineBookingQueue';

const ServerStatusIndicator = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [serverStatus, setServerStatus] = useState('unknown');
  const [queueStats, setQueueStats] = useState({ pending: 0, failed: 0 });
  const [lastChecked, setLastChecked] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  // Check server connectivity
  const checkServerStatus = async () => {
    try {
      const response = await axiosInstance.get('/health', { timeout: 5000 });
      if (response.status === 200) {
        setServerStatus('online');
        setConnectionStatus('connected');
      } else {
        setServerStatus('degraded');
        setConnectionStatus('connected');
      }
    } catch (error) {
      setServerStatus('offline');
      setConnectionStatus(navigator.onLine ? 'server-down' : 'offline');
    }
    setLastChecked(new Date());
  };

  // Update queue statistics
  const updateQueueStats = () => {
    const stats = offlineBookingQueue.getQueueStats();
    setQueueStats({
      pending: stats.pending + stats.processing,
      failed: stats.failed + stats.permanentlyFailed
    });
  };

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('connected');
      checkServerStatus();
    };

    const handleOffline = () => {
      setConnectionStatus('offline');
      setServerStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkServerStatus();
    updateQueueStats();

    // Periodic checks
    const statusInterval = setInterval(checkServerStatus, 30000); // Every 30 seconds
    const queueInterval = setInterval(updateQueueStats, 5000); // Every 5 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(statusInterval);
      clearInterval(queueInterval);
    };
  }, []);

  // Auto-hide after successful connection (but show on issues)
  useEffect(() => {
    if (connectionStatus === 'connected' && serverStatus === 'online' && queueStats.pending === 0 && queueStats.failed === 0) {
      const timer = setTimeout(() => setIsVisible(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [connectionStatus, serverStatus, queueStats]);

  const getStatusInfo = () => {
    if (connectionStatus === 'offline') {
      return {
        icon: <WifiOffIcon fontSize="small" />,
        label: 'Offline',
        color: 'error',
        tooltip: 'No internet connection. Bookings will be queued offline.'
      };
    }

    if (serverStatus === 'offline' || connectionStatus === 'server-down') {
      return {
        icon: <CloudOffIcon fontSize="small" />,
        label: 'Server Down',
        color: 'error',
        tooltip: 'Server is unreachable. Bookings will be queued offline.'
      };
    }

    if (serverStatus === 'degraded') {
      return {
        icon: <WarningIcon fontSize="small" />,
        label: 'Degraded',
        color: 'warning',
        tooltip: 'Server is responding but may be experiencing issues.'
      };
    }

    if (queueStats.pending > 0 || queueStats.failed > 0) {
      return {
        icon: <CloudDoneIcon fontSize="small" />,
        label: `Queue: ${queueStats.pending + queueStats.failed}`,
        color: queueStats.failed > 0 ? 'warning' : 'info',
        tooltip: `${queueStats.pending} pending, ${queueStats.failed} failed bookings in queue`
      };
    }

    return {
      icon: <CheckCircleIcon fontSize="small" />,
      label: 'Online',
      color: 'success',
      tooltip: `Server is online. Last checked: ${lastChecked?.toLocaleTimeString()}`
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Fade in={isVisible} timeout={500}>
      <Box
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1300,
          cursor: 'pointer'
        }}
        onClick={() => setIsVisible(!isVisible)}
      >
        <Tooltip title={statusInfo.tooltip} arrow placement="left">
          <Chip
            icon={statusInfo.icon}
            label={statusInfo.label}
            color={statusInfo.color}
            variant="filled"
            size="small"
            sx={{
              fontSize: '0.75rem',
              height: 28,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          />
        </Tooltip>
      </Box>
    </Fade>
  );
};

export default ServerStatusIndicator;