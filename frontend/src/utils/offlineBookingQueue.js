/**
 * Offline Booking Queue System
 * Handles booking creation when backend is unavailable
 * Provides retry mechanisms and automatic sync when connection is restored
 */

class OfflineBookingQueue {
  constructor() {
    this.queueKey = 'offline_booking_queue';
    this.retryIntervalId = null;
    this.maxRetries = 5;
    this.baseRetryDelay = 2000; // 2 seconds
    this.maxRetryDelay = 60000; // 1 minute
    this.isProcessing = false;
    
    // Initialize queue processing when online
    this.initializeConnectionMonitoring();
  }

  /**
   * Add a booking to the offline queue
   */
  addToQueue(bookingData, metadata = {}) {
    const queueItem = {
      id: this.generateId(),
      bookingData,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
        attempts: 0,
        lastAttempt: null,
        status: 'pending',
        originalMethod: metadata.method || 'unknown'
      }
    };

    const queue = this.getQueue();
    queue.push(queueItem);
    this.saveQueue(queue);

    console.log('Booking added to offline queue:', queueItem.id);
    
    // Show user notification
    this.showOfflineNotification(queueItem);
    
    // Try to process immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }

    return queueItem.id;
  }

  /**
   * Get current queue from localStorage
   */
  getQueue() {
    try {
      const queue = localStorage.getItem(this.queueKey);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error reading offline queue:', error);
      return [];
    }
  }

  /**
   * Save queue to localStorage
   */
  saveQueue(queue) {
    try {
      localStorage.setItem(this.queueKey, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  /**
   * Process the offline queue
   */
  async processQueue() {
    if (this.isProcessing || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;
    const queue = this.getQueue();
    const pendingItems = queue.filter(item => item.metadata.status === 'pending');

    console.log(`Processing ${pendingItems.length} pending bookings from offline queue`);

    for (const item of pendingItems) {
      try {
        await this.processQueueItem(item);
      } catch (error) {
        console.error('Error processing queue item:', error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Process a single queue item
   */
  async processQueueItem(item) {
    const queue = this.getQueue();
    const itemIndex = queue.findIndex(q => q.id === item.id);
    
    if (itemIndex === -1) {
      return;
    }

    // Update attempt count
    queue[itemIndex].metadata.attempts++;
    queue[itemIndex].metadata.lastAttempt = new Date().toISOString();
    queue[itemIndex].metadata.status = 'processing';
    this.saveQueue(queue);

    try {
      // Import axios instance dynamically to avoid circular dependencies
      const { default: axiosInstance } = await import('./axiosInstance');
      
      // Attempt to create the booking
      const response = await axiosInstance.post('/bookings', item.bookingData);
      
      if (response.status === 200 || response.status === 201) {
        // Success - remove from queue
        queue[itemIndex].metadata.status = 'completed';
        queue[itemIndex].metadata.completedAt = new Date().toISOString();
        queue[itemIndex].metadata.response = response.data;
        
        this.saveQueue(queue);
        
        // Show success notification
        this.showSuccessNotification(item, response.data);
        
        // Send calendar update and email notifications
        await this.sendNotifications(item, response.data);
        
        // Remove completed item after a delay (for user reference)
        setTimeout(() => {
          this.removeFromQueue(item.id);
        }, 30000); // Keep for 30 seconds
        
        console.log('Offline booking successfully processed:', item.id);
      }
    } catch (error) {
      console.error('Failed to process offline booking:', error);
      
      // Update failure status
      queue[itemIndex].metadata.status = 'failed';
      queue[itemIndex].metadata.error = error.message;
      
      // Check if we should retry
      if (queue[itemIndex].metadata.attempts < this.maxRetries) {
        // Schedule retry with exponential backoff
        const delay = Math.min(
          this.baseRetryDelay * Math.pow(2, queue[itemIndex].metadata.attempts - 1),
          this.maxRetryDelay
        );
        
        queue[itemIndex].metadata.status = 'pending';
        queue[itemIndex].metadata.nextRetry = new Date(Date.now() + delay).toISOString();
        
        console.log(`Scheduling retry for booking ${item.id} in ${delay}ms`);
        
        setTimeout(() => {
          this.processQueueItem(item);
        }, delay);
      } else {
        // Max retries reached - mark as permanently failed
        queue[itemIndex].metadata.status = 'permanently_failed';
        this.showFailureNotification(item);
      }
      
      this.saveQueue(queue);
    }
  }

  /**
   * Send calendar and email notifications for successful booking
   */
  async sendNotifications(queueItem, bookingResponse) {
    try {
      const { default: axiosInstance } = await import('./axiosInstance');
      
      // Send calendar sync notification
      await axiosInstance.post('/bookings/sync-calendar', {
        bookingId: bookingResponse._id || bookingResponse.id,
        source: 'offline_queue'
      }).catch(err => console.warn('Calendar sync failed:', err));
      
      // Send email notifications
      await axiosInstance.post('/bookings/send-notifications', {
        bookingId: bookingResponse._id || bookingResponse.id,
        type: 'booking_created',
        source: 'offline_queue'
      }).catch(err => console.warn('Email notification failed:', err));
      
    } catch (error) {
      console.warn('Failed to send notifications for offline booking:', error);
    }
  }

  /**
   * Remove item from queue
   */
  removeFromQueue(itemId) {
    const queue = this.getQueue();
    const filteredQueue = queue.filter(item => item.id !== itemId);
    this.saveQueue(filteredQueue);
    console.log(`Removed item ${itemId} from offline queue`);
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    const queue = this.getQueue();
    return {
      total: queue.length,
      pending: queue.filter(item => item.metadata.status === 'pending').length,
      processing: queue.filter(item => item.metadata.status === 'processing').length,
      completed: queue.filter(item => item.metadata.status === 'completed').length,
      failed: queue.filter(item => item.metadata.status === 'failed').length,
      permanentlyFailed: queue.filter(item => item.metadata.status === 'permanently_failed').length
    };
  }

  /**
   * Clear completed and old failed items
   */
  cleanupQueue() {
    const queue = this.getQueue();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const cleanedQueue = queue.filter(item => {
      // Keep pending and processing items
      if (['pending', 'processing'].includes(item.metadata.status)) {
        return true;
      }
      
      // Remove completed items older than 1 hour
      if (item.metadata.status === 'completed') {
        const completedAt = new Date(item.metadata.completedAt);
        return now.getTime() - completedAt.getTime() < 60 * 60 * 1000;
      }
      
      // Remove failed items older than 1 day
      if (['failed', 'permanently_failed'].includes(item.metadata.status)) {
        const createdAt = new Date(item.metadata.createdAt);
        return createdAt > oneDayAgo;
      }
      
      return true;
    });
    
    this.saveQueue(cleanedQueue);
  }

  /**
   * Initialize connection monitoring
   */
  initializeConnectionMonitoring() {
    // Process queue when coming online
    window.addEventListener('online', () => {
      console.log('Connection restored - processing offline booking queue');
      setTimeout(() => this.processQueue(), 1000);
    });

    // Start periodic processing
    this.startPeriodicProcessing();
    
    // Cleanup old items periodically
    setInterval(() => this.cleanupQueue(), 60 * 60 * 1000); // Every hour
  }

  /**
   * Start periodic queue processing
   */
  startPeriodicProcessing() {
    if (this.retryIntervalId) {
      clearInterval(this.retryIntervalId);
    }
    
    this.retryIntervalId = setInterval(() => {
      if (navigator.onLine && !this.isProcessing) {
        this.processQueue();
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop periodic processing
   */
  stopPeriodicProcessing() {
    if (this.retryIntervalId) {
      clearInterval(this.retryIntervalId);
      this.retryIntervalId = null;
    }
  }

  /**
   * Generate unique ID for queue items
   */
  generateId() {
    return 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Show offline notification to user
   */
  showOfflineNotification(queueItem) {
    // Import toast dynamically to avoid circular dependencies
    import('react-toastify').then(({ toast }) => {
      toast.info(
        `Booking saved offline and will be processed when connection is restored. Queue ID: ${queueItem.id.substr(-8)}`,
        {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        }
      );
    }).catch(err => console.warn('Toast notification failed:', err));
  }

  /**
   * Show success notification
   */
  showSuccessNotification(queueItem, response) {
    import('react-toastify').then(({ toast }) => {
      toast.success(
        `Offline booking successfully processed! Booking created for ${response.clientName || 'client'}.`,
        {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        }
      );
    }).catch(err => console.warn('Toast notification failed:', err));
  }

  /**
   * Show failure notification
   */
  showFailureNotification(queueItem) {
    import('react-toastify').then(({ toast }) => {
      toast.error(
        `Failed to process offline booking after ${this.maxRetries} attempts. Please check the booking manually.`,
        {
          position: 'top-right',
          autoClose: 10000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        }
      );
    }).catch(err => console.warn('Toast notification failed:', err));
  }

  /**
   * Get all queue items (for admin/debug purposes)
   */
  getAllQueueItems() {
    return this.getQueue();
  }

  /**
   * Force retry all failed items
   */
  retryAllFailed() {
    const queue = this.getQueue();
    queue.forEach(item => {
      if (['failed', 'permanently_failed'].includes(item.metadata.status)) {
        item.metadata.status = 'pending';
        item.metadata.attempts = 0;
        item.metadata.error = null;
      }
    });
    this.saveQueue(queue);
    
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  /**
   * Update retry count for a specific item
   */
  updateRetryCount(itemId) {
    const queue = this.getQueue();
    const itemIndex = queue.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
      queue[itemIndex].metadata.attempts = (queue[itemIndex].metadata.attempts || 0) + 1;
      queue[itemIndex].metadata.lastAttempt = new Date().toISOString();
      queue[itemIndex].metadata.status = 'failed';
      this.saveQueue(queue);
      console.log(`Updated retry count for item ${itemId}: ${queue[itemIndex].metadata.attempts}`);
    }
  }
}

// Create singleton instance
const offlineBookingQueue = new OfflineBookingQueue();

export default offlineBookingQueue;