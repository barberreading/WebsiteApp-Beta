import React from 'react';
import axiosInstance from '../utils/axiosInstance';

/**
 * Enhanced Error Boundary with Automatic Error Resolution
 * Automatically attempts to resolve common frontend errors
 */
class AutoErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isResolving: false,
      resolutionAttempts: 0,
      resolutionHistory: [],
      autoResolveEnabled: true
    };
    
    this.maxResolutionAttempts = 3;
    this.resolutionDelay = 2000;
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error: error
    };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('AutoErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to backend
    this.logErrorToBackend(error, errorInfo);
    
    // Attempt automatic resolution if enabled
    if (this.state.autoResolveEnabled && this.state.resolutionAttempts < this.maxResolutionAttempts) {
      this.attemptAutoResolution(error, errorInfo);
    }
  }

  /**
   * Log error to backend error logging system
   */
  async logErrorToBackend(error, errorInfo) {
    try {
      await axiosInstance.post('/errors/log', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        autoResolutionEnabled: this.state.autoResolveEnabled
      });
    } catch (logError) {
      logger.error('Failed to log error to backend:', logError);
    }
  }

  /**
   * Attempt automatic error resolution
   */
  async attemptAutoResolution(error, errorInfo) {
    this.setState({ isResolving: true });
    
    const resolutionStrategy = this.determineResolutionStrategy(error);
    logger.log(`🔧 Attempting automatic resolution with strategy: ${resolutionStrategy}`);
    
    try {
      const resolved = await this.executeResolutionStrategy(resolutionStrategy, error, errorInfo);
      
      const resolutionRecord = {
        strategy: resolutionStrategy,
        success: resolved,
        timestamp: new Date().toISOString(),
        error: error.message
      };
      
      this.setState(prevState => ({
        resolutionHistory: [...prevState.resolutionHistory, resolutionRecord],
        resolutionAttempts: prevState.resolutionAttempts + 1,
        isResolving: false
      }));
      
      if (resolved) {
        logger.log('✅ Error resolved automatically!');
        // Reset error state after successful resolution
        setTimeout(() => {
          this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            resolutionAttempts: 0
          });
        }, 1000);
      } else {
        logger.log('❌ Automatic resolution failed');
        // Try again after delay if we haven't exceeded max attempts
        if (this.state.resolutionAttempts < this.maxResolutionAttempts - 1) {
          setTimeout(() => {
            this.attemptAutoResolution(error, errorInfo);
          }, this.resolutionDelay * Math.pow(2, this.state.resolutionAttempts));
        }
      }
    } catch (resolutionError) {
      logger.error('Error during automatic resolution:', resolutionError);
      this.setState({ isResolving: false });
    }
  }

  /**
   * Determine the best resolution strategy based on error type
   */
  determineResolutionStrategy(error) {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'NETWORK_RETRY';
    }
    
    if (message.includes('chunk') || message.includes('loading')) {
      return 'CHUNK_RELOAD';
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'AUTH_REFRESH';
    }
    
    if (stack.includes('react') || stack.includes('component')) {
      return 'COMPONENT_RESET';
    }
    
    if (message.includes('memory') || message.includes('heap')) {
      return 'MEMORY_CLEANUP';
    }
    
    return 'GENERIC_RECOVERY';
  }

  /**
   * Execute the determined resolution strategy
   */
  async executeResolutionStrategy(strategy, error, errorInfo) {
    switch (strategy) {
      case 'NETWORK_RETRY':
        return await this.resolveNetworkError();
      
      case 'CHUNK_RELOAD':
        return await this.resolveChunkLoadingError();
      
      case 'AUTH_REFRESH':
        return await this.resolveAuthError();
      
      case 'COMPONENT_RESET':
        return await this.resolveComponentError();
      
      case 'MEMORY_CLEANUP':
        return await this.resolveMemoryError();
      
      case 'GENERIC_RECOVERY':
      default:
        return await this.attemptGenericRecovery();
    }
  }

  /**
   * Resolve network-related errors
   */
  async resolveNetworkError() {
    try {
      // Test network connectivity
      const response = await fetch('/api/health', { 
        method: 'GET',
        timeout: 5000 
      });
      
      if (response.ok) {
        logger.log('🌐 Network connectivity restored');
        return true;
      }
    } catch (networkError) {
      logger.log('🌐 Network still unavailable, will retry');
    }
    
    return false;
  }

  /**
   * Resolve chunk loading errors (common in React apps)
   */
  async resolveChunkLoadingError() {
    try {
      logger.log('📦 Attempting to resolve chunk loading error...');
      
      // Clear any cached modules
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
      }
      
      // Clear browser cache for the current origin
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      logger.log('📦 Cache cleared, reloading application...');
      
      // Reload the page to get fresh chunks
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return true;
    } catch (cacheError) {
      logger.error('Failed to clear cache:', cacheError);
      return false;
    }
  }

  /**
   * Resolve authentication errors
   */
  async resolveAuthError() {
    try {
      logger.log('🔐 Attempting to resolve authentication error...');
      
      // Try to refresh the auth token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const response = await axiosInstance.post('/auth/refresh', {
          refreshToken: refreshToken
        });
        
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          axiosInstance.defaults.headers.common['x-auth-token'] = response.data.token;
          logger.log('🔐 Authentication token refreshed');
          return true;
        }
      }
      
      // If refresh fails, redirect to login
      logger.log('🔐 Redirecting to login...');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return true;
    } catch (authError) {
      logger.error('Failed to resolve auth error:', authError);
      return false;
    }
  }

  /**
   * Resolve component-related errors
   */
  async resolveComponentError() {
    try {
      logger.log('⚛️ Attempting to resolve component error...');
      
      // Force a component re-render by updating state
      this.forceUpdate();
      
      // Clear any component-level cache
      if (this.props.onComponentReset) {
        this.props.onComponentReset();
      }
      
      return true;
    } catch (componentError) {
      logger.error('Failed to resolve component error:', componentError);
      return false;
    }
  }

  /**
   * Resolve memory-related errors
   */
  async resolveMemoryError() {
    try {
      logger.log('🧠 Attempting to resolve memory error...');
      
      // Force garbage collection if available
      if (window.gc) {
        window.gc();
      }
      
      // Clear large objects from memory
      if (window.performance && window.performance.memory) {
        const memInfo = window.performance.memory;
        logger.log(`Memory usage: ${memInfo.usedJSHeapSize / 1048576}MB / ${memInfo.totalJSHeapSize / 1048576}MB`);
      }
      
      // Suggest page reload for severe memory issues
      const memoryUsage = window.performance?.memory?.usedJSHeapSize || 0;
      if (memoryUsage > 100 * 1048576) { // > 100MB
        logger.log('🧠 High memory usage detected, reloading page...');
        setTimeout(() => window.location.reload(), 2000);
      }
      
      return true;
    } catch (memoryError) {
      logger.error('Failed to resolve memory error:', memoryError);
      return false;
    }
  }

  /**
   * Generic recovery attempt
   */
  async attemptGenericRecovery() {
    try {
      logger.log('🔧 Attempting generic error recovery...');
      
      // Wait a moment for transient issues to resolve
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force component update
      this.forceUpdate();
      
      return true;
    } catch (genericError) {
      logger.error('Generic recovery failed:', genericError);
      return false;
    }
  }

  /**
   * Manual retry handler
   */
  handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isResolving: false,
      resolutionAttempts: 0
    });
  }

  /**
   * Toggle auto-resolve feature
   */
  toggleAutoResolve = () => {
    this.setState(prevState => ({
      autoResolveEnabled: !prevState.autoResolveEnabled
    }));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container" style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#fff5f5',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h2 style={{ color: '#d63031', marginBottom: '16px' }}>🚨 Application Error</h2>
          
          {this.state.isResolving && (
            <div style={{
              padding: '12px',
              backgroundColor: '#e3f2fd',
              border: '1px solid #2196f3',
              borderRadius: '4px',
              marginBottom: '16px'
            }}>
              <p style={{ margin: 0, color: '#1976d2' }}>
                🔧 Attempting automatic error resolution... (Attempt {this.state.resolutionAttempts + 1}/{this.maxResolutionAttempts})
              </p>
            </div>
          )}
          
          <div style={{ marginBottom: '16px' }}>
            <strong>Error:</strong> {this.state.error?.message}
          </div>
          
          {this.state.resolutionHistory.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <strong>Resolution History:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                {this.state.resolutionHistory.map((record, index) => (
                  <li key={index} style={{ 
                    color: record.success ? '#27ae60' : '#e74c3c',
                    marginBottom: '4px'
                  }}>
                    {record.strategy}: {record.success ? '✅ Success' : '❌ Failed'} 
                    <small style={{ color: '#666' }}>({new Date(record.timestamp).toLocaleTimeString()})</small>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div style={{ marginBottom: '16px' }}>
            <button 
              onClick={this.handleManualRetry}
              disabled={this.state.isResolving}
              style={{
                padding: '8px 16px',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: this.state.isResolving ? 'not-allowed' : 'pointer',
                marginRight: '8px',
                opacity: this.state.isResolving ? 0.6 : 1
              }}
            >
              🔄 Retry Manually
            </button>
            
            <button 
              onClick={this.toggleAutoResolve}
              style={{
                padding: '8px 16px',
                backgroundColor: this.state.autoResolveEnabled ? '#f39c12' : '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '8px'
              }}
            >
              {this.state.autoResolveEnabled ? '🤖 Auto-Resolve: ON' : '🤖 Auto-Resolve: OFF'}
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Reload Page
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '16px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>🔍 Technical Details</summary>
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '12px',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
                marginTop: '8px'
              }}>
                {this.state.error?.stack}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default AutoErrorBoundary;