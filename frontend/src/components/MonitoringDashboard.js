import React, { useState, useEffect, useCallback } from 'react';
import './MonitoringDashboard.css';

const MonitoringDashboard = () => {
  const [monitoringData, setMonitoringData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [activeTab, setActiveTab] = useState('overview');
  const [metricsData, setMetricsData] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Fetch monitoring status
  const fetchMonitoringStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/monitoring/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMonitoringData(data.data);
      setError(null);
    } catch (err) {
      logger.error('Error fetching monitoring status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch detailed metrics
  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/monitoring/metrics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMetricsData(data.data);
      return data.data;
    } catch (err) {
      logger.error('Error fetching metrics:', err);
      setError('Failed to load metrics: ' + err.message);
      throw err;
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // Fetch error statistics
  const fetchStatistics = useCallback(async (timeframe = '24h') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/monitoring/statistics?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (err) {
      logger.error('Error fetching statistics:', err);
      throw err;
    }
  }, []);

  // Toggle auto-resolution
  const toggleAutoResolution = async (enabled) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/monitoring/auto-resolution', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Update local state
      setMonitoringData(prev => ({
        ...prev,
        autoResolutionEnabled: enabled
      }));

      // Show success message
      alert(data.message);
    } catch (err) {
      logger.error('Error toggling auto-resolution:', err);
      alert('Failed to toggle auto-resolution: ' + err.message);
    }
  };

  // Trigger manual health check
  const triggerHealthCheck = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/monitoring/health-check', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMonitoringData(data.data);
      alert('Health check completed successfully');
    } catch (err) {
      logger.error('Error triggering health check:', err);
      alert('Failed to perform health check: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Start/Stop monitoring
  const toggleMonitoring = async (start) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = start ? '/api/monitoring/start' : '/api/monitoring/stop';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Refresh monitoring status
      await fetchMonitoringStatus();
      
      alert(data.message);
    } catch (err) {
      logger.error('Error toggling monitoring:', err);
      alert('Failed to toggle monitoring: ' + err.message);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchMonitoringStatus();

    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMonitoringStatus, autoRefresh, refreshInterval]);

  // Format uptime
  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  if (loading && !monitoringData) {
    return (
      <div className="monitoring-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading monitoring dashboard...</p>
      </div>
    );
  }

  if (error && !monitoringData) {
    return (
      <div className="monitoring-dashboard error">
        <div className="error-message">
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={fetchMonitoringStatus} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="monitoring-dashboard">
      <div className="dashboard-header">
        <h2>System Monitoring Dashboard</h2>
        <div className="dashboard-controls">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            disabled={!autoRefresh}
          >
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
            <option value={60000}>1m</option>
            <option value={300000}>5m</option>
          </select>
          <button onClick={fetchMonitoringStatus} className="refresh-button">
            Refresh Now
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          Metrics
        </button>
        <button
          className={`tab ${activeTab === 'controls' ? 'active' : ''}`}
          onClick={() => setActiveTab('controls')}
        >
          Controls
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="status-cards">
              <div className="status-card">
                <h3>System Health</h3>
                <div 
                  className="status-indicator"
                  style={{ backgroundColor: getStatusColor(monitoringData?.systemHealth) }}
                >
                  {monitoringData?.systemHealth || 'Unknown'}
                </div>
              </div>
              
              <div className="status-card">
                <h3>Monitoring Status</h3>
                <div 
                  className="status-indicator"
                  style={{ backgroundColor: monitoringData?.isMonitoring ? '#4CAF50' : '#F44336' }}
                >
                  {monitoringData?.isMonitoring ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <div className="status-card">
                <h3>Auto-Resolution</h3>
                <div 
                  className="status-indicator"
                  style={{ backgroundColor: monitoringData?.autoResolutionEnabled ? '#4CAF50' : '#FF9800' }}
                >
                  {monitoringData?.autoResolutionEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              
              <div className="status-card">
                <h3>Error Count</h3>
                <div className="metric-value">
                  {monitoringData?.errorCount || 0}
                </div>
              </div>
            </div>

            <div className="system-info">
              <h3>System Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Server Uptime:</label>
                  <span>{formatUptime(monitoringData?.serverUptime || 0)}</span>
                </div>
                <div className="info-item">
                  <label>Last Health Check:</label>
                  <span>
                    {monitoringData?.lastHealthCheck 
                      ? new Date(monitoringData.lastHealthCheck).toLocaleString()
                      : 'Never'
                    }
                  </span>
                </div>
                <div className="info-item">
                  <label>Node.js Version:</label>
                  <span>{monitoringData?.nodeVersion || 'Unknown'}</span>
                </div>
                <div className="info-item">
                  <label>Environment:</label>
                  <span>{monitoringData?.environment || 'production'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="metrics-tab">
            {!metricsData ? (
              <div className="metrics-placeholder">
                <h3>System Metrics</h3>
                <p>Click the button below to load detailed system metrics...</p>
                <button 
                  onClick={fetchMetrics}
                  disabled={metricsLoading}
                  className={metricsLoading ? 'loading' : ''}
                >
                  {metricsLoading ? 'Loading...' : 'Load Metrics'}
                </button>
              </div>
            ) : (
              <div className="metrics-content">
                <div className="metrics-header">
                  <h3>System Metrics</h3>
                  <button onClick={fetchMetrics} disabled={metricsLoading}>
                    {metricsLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
                
                <div className="metrics-grid">
                  {/* Process Metrics */}
                  <div className="metric-card">
                    <h4>Process Information</h4>
                    <div className="metric-item">
                      <label>Uptime:</label>
                      <span>{Math.floor(metricsData.processMetrics?.uptime / 3600)}h {Math.floor((metricsData.processMetrics?.uptime % 3600) / 60)}m</span>
                    </div>
                    <div className="metric-item">
                      <label>Node Version:</label>
                      <span>{metricsData.processMetrics?.version}</span>
                    </div>
                    <div className="metric-item">
                      <label>Platform:</label>
                      <span>{metricsData.processMetrics?.platform} ({metricsData.processMetrics?.arch})</span>
                    </div>
                    <div className="metric-item">
                      <label>Process ID:</label>
                      <span>{metricsData.processMetrics?.pid}</span>
                    </div>
                  </div>

                  {/* Memory Metrics */}
                  <div className="metric-card">
                    <h4>Memory Usage</h4>
                    <div className="metric-item">
                      <label>RSS:</label>
                      <span>{Math.round(metricsData.processMetrics?.memoryUsage?.rss / 1024 / 1024)}MB</span>
                    </div>
                    <div className="metric-item">
                      <label>Heap Used:</label>
                      <span>{Math.round(metricsData.processMetrics?.memoryUsage?.heapUsed / 1024 / 1024)}MB</span>
                    </div>
                    <div className="metric-item">
                      <label>Heap Total:</label>
                      <span>{Math.round(metricsData.processMetrics?.memoryUsage?.heapTotal / 1024 / 1024)}MB</span>
                    </div>
                    <div className="metric-item">
                      <label>External:</label>
                      <span>{Math.round(metricsData.processMetrics?.memoryUsage?.external / 1024 / 1024)}MB</span>
                    </div>
                  </div>

                  {/* System Status */}
                  <div className="metric-card">
                    <h4>System Status</h4>
                    <div className="metric-item">
                      <label>Monitoring:</label>
                      <span className={`status-badge ${metricsData.isMonitoring ? 'active' : 'inactive'}`}>
                        {metricsData.isMonitoring ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="metric-item">
                      <label>Auto Resolution:</label>
                      <span className={`status-badge ${metricsData.autoResolutionEnabled ? 'enabled' : 'disabled'}`}>
                        {metricsData.autoResolutionEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="metric-item">
                      <label>Last Health Check:</label>
                      <span>{metricsData.lastHealthCheck ? new Date(metricsData.lastHealthCheck).toLocaleString() : 'Never'}</span>
                    </div>
                  </div>

                  {/* Environment Info */}
                  <div className="metric-card">
                    <h4>Environment</h4>
                    <div className="metric-item">
                      <label>Node Environment:</label>
                      <span>{metricsData.environmentInfo?.nodeEnv || 'production'}</span>
                    </div>
                    <div className="metric-item">
                      <label>Port:</label>
                      <span>{metricsData.environmentInfo?.port}</span>
                    </div>
                    <div className="metric-item">
                      <label>MongoDB:</label>
                      <span className={`status-badge ${metricsData.environmentInfo?.mongoUri === 'Connected' ? 'connected' : 'disconnected'}`}>
                        {metricsData.environmentInfo?.mongoUri}
                      </span>
                    </div>
                    <div className="metric-item">
                      <label>JWT Secret:</label>
                      <span className={`status-badge ${metricsData.environmentInfo?.jwtSecret === 'Configured' ? 'configured' : 'missing'}`}>
                        {metricsData.environmentInfo?.jwtSecret}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'controls' && (
          <div className="controls-tab">
            <div className="control-section">
              <h3>Monitoring Controls</h3>
              <div className="control-buttons">
                <button
                  onClick={() => toggleMonitoring(!monitoringData?.isMonitoring)}
                  className={`control-button ${monitoringData?.isMonitoring ? 'stop' : 'start'}`}
                >
                  {monitoringData?.isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
                </button>
                
                <button
                  onClick={() => toggleAutoResolution(!monitoringData?.autoResolutionEnabled)}
                  className={`control-button ${monitoringData?.autoResolutionEnabled ? 'disable' : 'enable'}`}
                >
                  {monitoringData?.autoResolutionEnabled ? 'Disable Auto-Resolution' : 'Enable Auto-Resolution'}
                </button>
                
                <button
                  onClick={triggerHealthCheck}
                  className="control-button health-check"
                  disabled={loading}
                >
                  {loading ? 'Checking...' : 'Run Health Check'}
                </button>
              </div>
            </div>

            <div className="control-section">
              <h3>System Actions</h3>
              <div className="control-buttons">
                <button
                  onClick={() => fetchStatistics().then(console.log)}
                  className="control-button info"
                >
                  View Statistics
                </button>
                
                <button
                  onClick={() => window.open('/api/monitoring/resolution-history', '_blank')}
                  className="control-button info"
                >
                  View Error History
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-footer">
        <p>
          Last updated: {monitoringData?.timestamp 
            ? new Date(monitoringData.timestamp).toLocaleString()
            : 'Never'
          }
        </p>
      </div>
    </div>
  );
};

export default MonitoringDashboard;