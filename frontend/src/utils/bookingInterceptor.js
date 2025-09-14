/**
 * Booking Interceptor
 * Intercepts booking creation requests and handles failures by routing to offline queue
 */

import offlineBookingQueue from './offlineBookingQueue';
import axiosInstance from './axiosInstance';

class BookingInterceptor {
  constructor() {
    this.setupInterceptors();
    this.bookingEndpoints = [
      '/bookings',
      '/api/bookings',
      '/bookings/create',
      '/api/bookings/create'
    ];
  }

  /**
   * Setup axios interceptors for booking requests
   */
  setupInterceptors() {
    // Request interceptor to mark booking requests
    axiosInstance.interceptors.request.use(
      (config) => {
        // Mark booking requests for special handling
        if (this.isBookingRequest(config)) {
          config.metadata = {
            ...config.metadata,
            isBookingRequest: true,
            originalUrl: config.url,
            timestamp: new Date().toISOString()
          };
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle booking failures
    axiosInstance.interceptors.response.use(
      (response) => {
        // Success - no action needed
        return response;
      },
      async (error) => {
        // Check if this is a failed booking request
        if (this.shouldInterceptBookingError(error)) {
          return await this.handleBookingFailure(error);
        }
        
        // For non-booking requests, use original error handling
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if request is a booking creation request
   */
  isBookingRequest(config) {
    if (!config.url || config.method?.toLowerCase() !== 'post') {
      return false;
    }

    return this.bookingEndpoints.some(endpoint => 
      config.url.includes(endpoint)
    );
  }

  /**
   * Check if booking error should be intercepted
   */
  shouldInterceptBookingError(error) {
    const config = error.config;
    
    // Must be a booking request
    if (!config?.metadata?.isBookingRequest) {
      return false;
    }

    // Check for network/connection errors
    if (!error.response) {
      // Network error, timeout, or no response
      return true;
    }

    // Check for server errors that might indicate database issues
    const status = error.response.status;
    if (status >= 500) {
      // Server errors (500, 502, 503, 504, etc.)
      return true;
    }

    // Check for specific database-related error messages
    const errorMessage = error.response.data?.message || error.message || '';
    const dbErrorKeywords = [
      'database',
      'connection',
      'timeout',
      'unavailable',
      'service temporarily unavailable',
      'internal server error',
      'mongodb',
      'mongoose'
    ];

    if (dbErrorKeywords.some(keyword => 
      errorMessage.toLowerCase().includes(keyword)
    )) {
      return true;
    }

    return false;
  }

  /**
   * Handle booking failure by adding to offline queue
   */
  async handleBookingFailure(error) {
    const config = error.config;
    const bookingData = this.parseBookingData(config.data);
    
    logger.log('Intercepting failed booking request:', {
      url: config.url,
      error: error.message,
      status: error.response?.status
    });

    try {
      // Add to offline queue
      const queueId = offlineBookingQueue.addToQueue(bookingData, {
        method: 'intercepted',
        originalUrl: config.url,
        originalError: error.message,
        errorStatus: error.response?.status,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });

      // Return a modified response that indicates offline queuing
      const offlineResponse = {
        data: {
          success: true,
          offline: true,
          queueId: queueId,
          message: 'Booking saved offline and will be processed when connection is restored',
          bookingData: bookingData,
          estimatedProcessingTime: this.getEstimatedProcessingTime()
        },
        status: 202, // Accepted
        statusText: 'Accepted - Queued for Processing',
        headers: error.config?.headers || {},
        config: error.config
      };

      return Promise.resolve(offlineResponse);
    } catch (queueError) {
      logger.error('Failed to add booking to offline queue:', queueError);
      
      // If we can't queue it, reject with enhanced error info
      const enhancedError = new Error(
        `Booking failed and could not be queued offline: ${error.message}`
      );
      enhancedError.originalError = error;
      enhancedError.queueError = queueError;
      
      return Promise.reject(enhancedError);
    }
  }

  /**
   * Parse booking data from request
   */
  parseBookingData(requestData) {
    try {
      if (typeof requestData === 'string') {
        return JSON.parse(requestData);
      }
      return requestData || {};
    } catch (error) {
      logger.warn('Failed to parse booking data:', error);
      return {};
    }
  }

  /**
   * Get estimated processing time based on current queue
   */
  getEstimatedProcessingTime() {
    const stats = offlineBookingQueue.getQueueStats();
    const pendingCount = stats.pending + stats.processing;
    
    // Estimate 30 seconds per booking + base delay
    const estimatedSeconds = Math.max(30, pendingCount * 30);
    
    return {
      seconds: estimatedSeconds,
      humanReadable: this.formatDuration(estimatedSeconds)
    };
  }

  /**
   * Format duration in human readable format
   */
  formatDuration(seconds) {
    if (seconds < 60) {
      return `${seconds} seconds`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
    }
  }

  /**
   * Manual booking creation with offline fallback
   */
  async createBookingWithFallback(bookingData, options = {}) {
    try {
      // Try normal booking creation first
      const response = await axiosInstance.post('/bookings', bookingData);
      return response;
    } catch (error) {
      // If it fails and should be intercepted, handle it
      if (this.shouldInterceptBookingError(error)) {
        // Create a mock config for the interceptor
        const mockConfig = {
          url: '/bookings',
          method: 'post',
          data: bookingData,
          metadata: {
            isBookingRequest: true,
            originalUrl: '/bookings',
            timestamp: new Date().toISOString()
          }
        };
        
        error.config = mockConfig;
        return await this.handleBookingFailure(error);
      }
      
      // If not interceptable, throw the original error
      throw error;
    }
  }

  /**
   * Get current queue status
   */
  getQueueStatus() {
    return offlineBookingQueue.getQueueStats();
  }

  /**
   * Force process queue (for manual retry)
   */
  async processQueue() {
    return await offlineBookingQueue.processQueue();
  }

  /**
   * Sync queue with server when online
   */
  async syncQueue() {
    if (!navigator.onLine) {
      logger.log('Cannot sync: offline');
      return { success: false, reason: 'offline' };
    }

    const queuedBookings = offlineBookingQueue.getAllQueueItems();
    if (queuedBookings.length === 0) {
      return { success: true, synced: 0 };
    }

    logger.log(`Syncing ${queuedBookings.length} offline bookings...`);
    
    try {
      // Prepare bookings for sync
      const bookingsToSync = queuedBookings.map(item => ({
        ...item.data,
        offlineId: item.id,
        offlineTimestamp: item.timestamp
      }));

      // Send to sync endpoint
      const response = await axiosInstance.post('/api/bookings/sync-offline', {
        bookings: bookingsToSync
      });

      if (response.data.success) {
        const { successful, failed, duplicates } = response.data.data;
        const { summary } = response.data;

        logger.log('Sync completed:', summary);

        // Remove successfully synced items from queue
        successful.forEach(item => {
          offlineBookingQueue.removeFromQueue(item.offlineId);
        });

        // Remove duplicates from queue (already exist on server)
        duplicates.forEach(item => {
          offlineBookingQueue.removeFromQueue(item.offlineId);
        });

        // Update failed items with retry count
        failed.forEach(item => {
          offlineBookingQueue.updateRetryCount(item.offlineId);
        });

        return {
          success: true,
          synced: successful.length + duplicates.length,
          failed: failed.length,
          details: response.data.data
        };
      } else {
        throw new Error(response.data.error || 'Sync failed');
      }
    } catch (error) {
      logger.error('Sync failed:', error);
      return {
        success: false,
        error: error.message,
        synced: 0
      };
    }
  }

  /**
   * Get all queued bookings
   */
  getQueuedBookings() {
    return offlineBookingQueue.getAllQueueItems();
  }

  /**
   * Retry all failed bookings
   */
  retryFailedBookings() {
    return offlineBookingQueue.retryAllFailed();
  }

  /**
   * Check if booking creation should use offline-first approach
   */
  shouldUseOfflineFirst() {
    // Use offline-first if:
    // 1. Currently offline
    // 2. Recent connection issues
    // 3. High queue backlog
    
    if (!navigator.onLine) {
      return true;
    }

    const stats = offlineBookingQueue.getQueueStats();
    if (stats.pending > 5 || stats.failed > 2) {
      return true;
    }

    // Check for recent connection issues in localStorage
    try {
      const recentErrors = localStorage.getItem('recent_connection_errors');
      if (recentErrors) {
        const errors = JSON.parse(recentErrors);
        const recentErrorCount = errors.filter(error => 
          new Date().getTime() - new Date(error.timestamp).getTime() < 5 * 60 * 1000 // 5 minutes
        ).length;
        
        if (recentErrorCount > 2) {
          return true;
        }
      }
    } catch (error) {
      logger.warn('Failed to check recent connection errors:', error);
    }

    return false;
  }

  /**
   * Record connection error for offline-first decision making
   */
  recordConnectionError(error) {
    try {
      const recentErrors = JSON.parse(localStorage.getItem('recent_connection_errors') || '[]');
      
      recentErrors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        status: error.response?.status
      });
      
      // Keep only last 10 errors
      const trimmedErrors = recentErrors.slice(-10);
      
      localStorage.setItem('recent_connection_errors', JSON.stringify(trimmedErrors));
    } catch (storageError) {
      logger.warn('Failed to record connection error:', storageError);
    }
  }

  /**
   * Initialize the booking interceptor
   */
  initialize() {
    logger.log('Booking interceptor initialized');
    // Initialize offline queue connection monitoring
    offlineBookingQueue.initializeConnectionMonitoring();
    return this;
  }

  /**
   * Cleanup interceptors and resources
   */
  cleanup() {
    logger.log('Cleaning up booking interceptor');
    // Stop periodic processing
    offlineBookingQueue.stopPeriodicProcessing();
    
    // Clear axios interceptors
    axiosInstance.interceptors.request.clear();
    axiosInstance.interceptors.response.clear();
  }
}

// Create singleton instance
const bookingInterceptor = new BookingInterceptor();

export default bookingInterceptor;