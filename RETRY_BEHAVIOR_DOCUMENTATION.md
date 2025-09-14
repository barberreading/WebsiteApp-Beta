# Automatic Retry Behavior Documentation

## Overview

The application now implements automatic retry functionality for all API requests using `axios-retry`. This ensures better resilience when the server is temporarily unavailable or experiencing issues.

## Implementation Details

### Configuration Location
- **File**: `frontend/src/utils/axiosInstance.js`
- **Library**: `axios-retry` v4.5.0

### Retry Settings

```javascript
axiosRetry(axiosInstance, {
  retries: 3,                           // Maximum 3 retry attempts
  retryDelay: axiosRetry.exponentialDelay, // Exponential backoff (1s, 2s, 4s)
  retryCondition: (error) => { ... },   // Custom retry logic
  onRetry: (retryCount, error, requestConfig) => { ... } // Logging
});
```

### When Retries Occur

The system will automatically retry requests in the following scenarios:

✅ **Will Retry:**
- Network errors (server unreachable)
- 5xx server errors (500, 502, 503, 504)
- Request timeouts (ECONNABORTED)
- Connection refused errors (ECONNREFUSED)

❌ **Will NOT Retry:**
- 4xx client errors (400, 401, 403, 404)
- Authentication failures
- Validation errors
- Malformed requests

### Retry Timing

- **Delay Strategy**: Exponential backoff
- **First retry**: ~1 second
- **Second retry**: ~2 seconds  
- **Third retry**: ~4 seconds
- **Total max time**: ~7 seconds before final failure

## User Experience Impact

### Before Implementation
- Immediate failure on server downtime
- Users had to manually refresh/retry
- Poor experience during temporary outages

### After Implementation
- Automatic recovery from temporary issues
- Seamless experience during brief server problems
- Users only see errors after genuine failures
- Loading states may last longer (up to 7 seconds)

## Affected Components

All components using the axios instance will benefit from retry behavior:

- **Authentication**: Login, logout, token refresh
- **Calendar**: Event loading and management
- **Bookings**: Creation, updates, cancellations
- **User Management**: Profile updates, preferences
- **General API calls**: Health checks, data fetching

## Logging and Monitoring

### Console Logs
Retry attempts are logged to the browser console:
```
🔄 Retry attempt 1 for GET /api/calendar/events
🔄 Retry attempt 2 for GET /api/calendar/events
```

### Error Handling
Final errors (after all retries exhausted) include:
- Original error information
- Number of retry attempts made
- Total time spent retrying

## Testing

### Automated Tests
A test script (`test_retry_functionality.js`) verifies:
- Retry behavior with server down
- Proper handling of different error types
- Exponential backoff timing
- Retry attempt logging

### Manual Testing Scenarios
1. **Server Restart**: Stop backend, make request, start backend
2. **Network Issues**: Disconnect internet briefly during requests
3. **Server Overload**: Simulate 503 responses
4. **Authentication**: Verify 401 errors don't retry

## Performance Considerations

### Positive Impact
- Reduced user frustration
- Better handling of temporary issues
- Improved application reliability

### Potential Concerns
- Slightly longer loading times in failure scenarios
- Increased server load during outages (retries)
- More complex debugging (multiple attempts)

## Configuration Customization

To modify retry behavior, edit `frontend/src/utils/axiosInstance.js`:

```javascript
// Reduce retries for faster failures
retries: 2,

// Use fixed delay instead of exponential
retryDelay: () => 1000,

// Add custom retry conditions
retryCondition: (error) => {
  // Your custom logic here
  return shouldRetry;
}
```

## Troubleshooting

### Common Issues

1. **Requests taking too long**
   - Check if retries are occurring unnecessarily
   - Consider reducing retry count or timeout

2. **Authentication loops**
   - Verify 401 errors are not being retried
   - Check token refresh logic

3. **Server overload**
   - Monitor retry frequency during outages
   - Consider implementing circuit breaker pattern

### Debug Information

Enable detailed logging by modifying the `onRetry` callback:

```javascript
onRetry: (retryCount, error, requestConfig) => {
  console.log(`🔄 Retry ${retryCount}/${retries}`, {
    url: requestConfig.url,
    method: requestConfig.method,
    error: error.message,
    timestamp: new Date().toISOString()
  });
}
```

## Future Enhancements

### Potential Improvements
- Circuit breaker pattern for repeated failures
- User notification for ongoing retry attempts
- Configurable retry settings per endpoint
- Retry analytics and monitoring
- Progressive retry delays based on error type

### Integration Opportunities
- Service worker for offline retry queuing
- Background sync for failed requests
- User preference for retry behavior
- Server-side retry coordination

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Author**: Development Team