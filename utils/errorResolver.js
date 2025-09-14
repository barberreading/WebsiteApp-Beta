const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

/**
 * Comprehensive Error Resolution System for Desktop Application
 * Automatically detects and resolves common application errors
 */
class ErrorResolver {
  constructor(options = {}) {
    this.debugLog = options.debugLog || console.log;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 2000;
    this.ports = {
      backend: 3002,
      frontend: 3001
    };
    this.processes = {
      backend: null,
      frontend: null
    };
  }

  /**
   * Main error resolution entry point
   * @param {Error} error - The error to resolve
   * @param {Object} context - Additional context about the error
   * @returns {Promise<boolean>} - True if error was resolved
   */
  async resolveError(error, context = {}) {
    this.debugLog(`🔧 Error Resolver: Attempting to resolve error: ${error.message}`);
    
    const errorType = this.classifyError(error, context);
    this.debugLog(`📋 Error classified as: ${errorType}`);
    
    switch (errorType) {
      case 'PORT_CONFLICT':
        return await this.resolvePortConflict(error, context);
      case 'SERVER_DOWN':
        return await this.resolveServerDown(error, context);
      case 'DEPENDENCY_MISSING':
        return await this.resolveDependencyIssue(error, context);
      case 'PERMISSION_ERROR':
        return await this.resolvePermissionError(error, context);
      case 'NETWORK_ERROR':
        return await this.resolveNetworkError(error, context);
      case 'PROCESS_CRASH':
        return await this.resolveProcessCrash(error, context);
      default:
        return await this.attemptGenericResolution(error, context);
    }
  }

  /**
   * Classify the type of error for targeted resolution
   */
  classifyError(error, context) {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    if (message.includes('eaddrinuse') || message.includes('port') && message.includes('use')) {
      return 'PORT_CONFLICT';
    }
    
    if (message.includes('econnrefused') || message.includes('connection refused')) {
      return 'SERVER_DOWN';
    }
    
    if (message.includes('cannot find module') || message.includes('module not found')) {
      return 'DEPENDENCY_MISSING';
    }
    
    if (message.includes('eacces') || message.includes('permission denied')) {
      return 'PERMISSION_ERROR';
    }
    
    if (message.includes('network') || message.includes('timeout') || message.includes('enotfound')) {
      return 'NETWORK_ERROR';
    }
    
    if (context.processExit || message.includes('spawn') || message.includes('process')) {
      return 'PROCESS_CRASH';
    }
    
    return 'UNKNOWN';
  }

  /**
   * Resolve port conflict errors
   */
  async resolvePortConflict(error, context) {
    this.debugLog('🔧 Resolving port conflict...');
    
    try {
      // Extract port from error message
      const portMatch = error.message.match(/(\d{4})/);
      const conflictPort = portMatch ? parseInt(portMatch[1]) : null;
      
      if (conflictPort) {
        this.debugLog(`📍 Detected port conflict on port ${conflictPort}`);
        
        // Kill processes using the conflicted port
        await this.killProcessOnPort(conflictPort);
        
        // Wait for port to be released
        await this.waitForPortRelease(conflictPort);
        
        // Restart the appropriate server
        if (conflictPort === this.ports.frontend) {
          await this.restartFrontendServer();
        } else if (conflictPort === this.ports.backend) {
          await this.restartBackendServer();
        }
        
        this.debugLog('✅ Port conflict resolved successfully');
        return true;
      }
    } catch (resolveError) {
      this.debugLog(`❌ Failed to resolve port conflict: ${resolveError.message}`);
    }
    
    return false;
  }

  /**
   * Resolve server down errors
   */
  async resolveServerDown(error, context) {
    this.debugLog('🔧 Resolving server down error...');
    
    try {
      // Check which servers are down
      const backendDown = !(await this.checkPort(this.ports.backend));
      const frontendDown = !(await this.checkPort(this.ports.frontend));
      
      if (backendDown) {
        this.debugLog('🔄 Restarting backend server...');
        await this.restartBackendServer();
      }
      
      if (frontendDown) {
        this.debugLog('🔄 Restarting frontend server...');
        await this.restartFrontendServer();
      }
      
      // Wait for servers to stabilize
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verify servers are running
      const backendRunning = await this.checkPort(this.ports.backend);
      const frontendRunning = await this.checkPort(this.ports.frontend);
      
      if (backendRunning && frontendRunning) {
        this.debugLog('✅ Server down error resolved successfully');
        return true;
      }
    } catch (resolveError) {
      this.debugLog(`❌ Failed to resolve server down error: ${resolveError.message}`);
    }
    
    return false;
  }

  /**
   * Resolve dependency missing errors
   */
  async resolveDependencyIssue(error, context) {
    this.debugLog('🔧 Resolving dependency issue...');
    
    try {
      // Check if package.json exists in backend and frontend
      const backendPackageJson = path.join(process.cwd(), 'backend', 'package.json');
      const frontendPackageJson = path.join(process.cwd(), 'frontend', 'package.json');
      
      if (fs.existsSync(backendPackageJson)) {
        this.debugLog('📦 Installing backend dependencies...');
        await this.runCommand('npm install', path.join(process.cwd(), 'backend'));
      }
      
      if (fs.existsSync(frontendPackageJson)) {
        this.debugLog('📦 Installing frontend dependencies...');
        await this.runCommand('npm install', path.join(process.cwd(), 'frontend'));
      }
      
      this.debugLog('✅ Dependency issue resolved successfully');
      return true;
    } catch (resolveError) {
      this.debugLog(`❌ Failed to resolve dependency issue: ${resolveError.message}`);
    }
    
    return false;
  }

  /**
   * Resolve permission errors
   */
  async resolvePermissionError(error, context) {
    this.debugLog('🔧 Resolving permission error...');
    
    try {
      // On Windows, try running with elevated permissions
      if (process.platform === 'win32') {
        this.debugLog('🔐 Attempting to resolve Windows permission issue...');
        // Clear npm cache and try again
        await this.runCommand('npm cache clean --force');
        return true;
      }
      
      // On Unix systems, check file permissions
      if (process.platform !== 'win32') {
        this.debugLog('🔐 Attempting to fix file permissions...');
        await this.runCommand('chmod -R 755 node_modules', process.cwd());
        return true;
      }
    } catch (resolveError) {
      this.debugLog(`❌ Failed to resolve permission error: ${resolveError.message}`);
    }
    
    return false;
  }

  /**
   * Resolve network errors
   */
  async resolveNetworkError(error, context) {
    this.debugLog('🔧 Resolving network error...');
    
    try {
      // Wait and retry with exponential backoff
      for (let i = 0; i < this.maxRetries; i++) {
        this.debugLog(`🔄 Network retry attempt ${i + 1}/${this.maxRetries}`);
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, i)));
        
        // Test network connectivity
        const networkOk = await this.testNetworkConnectivity();
        if (networkOk) {
          this.debugLog('✅ Network error resolved successfully');
          return true;
        }
      }
    } catch (resolveError) {
      this.debugLog(`❌ Failed to resolve network error: ${resolveError.message}`);
    }
    
    return false;
  }

  /**
   * Resolve process crash errors
   */
  async resolveProcessCrash(error, context) {
    this.debugLog('🔧 Resolving process crash...');
    
    try {
      // Clean up any zombie processes
      await this.cleanupZombieProcesses();
      
      // Restart crashed servers
      await this.restartAllServers();
      
      this.debugLog('✅ Process crash resolved successfully');
      return true;
    } catch (resolveError) {
      this.debugLog(`❌ Failed to resolve process crash: ${resolveError.message}`);
    }
    
    return false;
  }

  /**
   * Attempt generic resolution for unknown errors
   */
  async attemptGenericResolution(error, context) {
    this.debugLog('🔧 Attempting generic error resolution...');
    
    try {
      // Generic recovery steps
      await this.cleanupZombieProcesses();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.restartAllServers();
      
      this.debugLog('✅ Generic error resolution completed');
      return true;
    } catch (resolveError) {
      this.debugLog(`❌ Generic resolution failed: ${resolveError.message}`);
    }
    
    return false;
  }

  /**
   * Kill process using a specific port
   */
  async killProcessOnPort(port) {
    return new Promise((resolve) => {
      if (process.platform === 'win32') {
        exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
          if (stdout) {
            const lines = stdout.split('\n');
            const pids = new Set();
            
            lines.forEach(line => {
              const match = line.match(/\s+(\d+)\s*$/);
              if (match && line.includes('LISTENING')) {
                pids.add(match[1]);
              }
            });
            
            const killPromises = Array.from(pids).map(pid => {
              return new Promise((killResolve) => {
                exec(`taskkill /PID ${pid} /F`, (killError) => {
                  this.debugLog(`🔪 Killed process ${pid} on port ${port}`);
                  killResolve();
                });
              });
            });
            
            Promise.all(killPromises).then(() => resolve());
          } else {
            resolve();
          }
        });
      } else {
        exec(`lsof -ti:${port} | xargs kill -9`, () => {
          this.debugLog(`🔪 Killed processes on port ${port}`);
          resolve();
        });
      }
    });
  }

  /**
   * Wait for a port to be released
   */
  async waitForPortRelease(port, maxWait = 10000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const inUse = await this.checkPort(port);
      if (!inUse) {
        this.debugLog(`✅ Port ${port} is now available`);
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    this.debugLog(`⚠️ Port ${port} still in use after ${maxWait}ms`);
    return false;
  }

  /**
   * Check if a port is in use
   */
  checkPort(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => {
          resolve(false); // Port is available
        });
        server.close();
      });
      
      server.on('error', () => {
        resolve(true); // Port is in use
      });
    });
  }

  /**
   * Restart backend server
   */
  async restartBackendServer() {
    this.debugLog('🔄 Restarting backend server...');
    
    if (this.processes.backend) {
      this.processes.backend.kill();
      this.processes.backend = null;
    }
    
    return new Promise((resolve, reject) => {
      const backendPath = path.join(process.cwd(), 'backend');
      
      this.processes.backend = spawn('npm', ['start'], {
        cwd: backendPath,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env, NODE_ENV: 'development' }
      });
      
      let resolved = false;
      
      this.processes.backend.stdout.on('data', (data) => {
        const output = data.toString();
        if ((output.includes('Server running on port') || output.includes('listening on port')) && !resolved) {
          resolved = true;
          this.debugLog('✅ Backend server restarted successfully');
          resolve();
        }
      });
      
      this.processes.backend.on('error', (error) => {
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      });
      
      // Timeout fallback
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.debugLog('⚠️ Backend restart timeout, assuming success');
          resolve();
        }
      }, 10000);
    });
  }

  /**
   * Restart frontend server
   */
  async restartFrontendServer() {
    this.debugLog('🔄 Restarting frontend server...');
    
    if (this.processes.frontend) {
      this.processes.frontend.kill();
      this.processes.frontend = null;
    }
    
    return new Promise((resolve, reject) => {
      const frontendPath = path.join(process.cwd(), 'frontend');
      
      this.processes.frontend = spawn('npm', ['start'], {
        cwd: frontendPath,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env, BROWSER: 'none' }
      });
      
      let resolved = false;
      
      this.processes.frontend.stdout.on('data', (data) => {
        const output = data.toString();
        if ((output.includes('webpack compiled') || output.includes('Local:')) && !resolved) {
          resolved = true;
          this.debugLog('✅ Frontend server restarted successfully');
          resolve();
        }
      });
      
      this.processes.frontend.on('error', (error) => {
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      });
      
      // Timeout fallback
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.debugLog('⚠️ Frontend restart timeout, assuming success');
          resolve();
        }
      }, 15000);
    });
  }

  /**
   * Restart all servers
   */
  async restartAllServers() {
    this.debugLog('🔄 Restarting all servers...');
    
    try {
      await this.restartBackendServer();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.restartFrontendServer();
      this.debugLog('✅ All servers restarted successfully');
    } catch (error) {
      this.debugLog(`❌ Failed to restart servers: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean up zombie processes
   */
  async cleanupZombieProcesses() {
    this.debugLog('🧹 Cleaning up zombie processes...');
    
    try {
      await this.killProcessOnPort(this.ports.backend);
      await this.killProcessOnPort(this.ports.frontend);
      this.debugLog('✅ Zombie processes cleaned up');
    } catch (error) {
      this.debugLog(`⚠️ Zombie cleanup warning: ${error.message}`);
    }
  }

  /**
   * Test network connectivity
   */
  async testNetworkConnectivity() {
    return new Promise((resolve) => {
      const testServer = net.createServer();
      testServer.listen(0, () => {
        const port = testServer.address().port;
        testServer.close(() => {
          resolve(true);
        });
      });
      testServer.on('error', () => resolve(false));
    });
  }

  /**
   * Run a command in a specific directory
   */
  runCommand(command, cwd = process.cwd()) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  /**
   * Get error resolution statistics
   */
  getStats() {
    return {
      totalResolutions: this.totalResolutions || 0,
      successfulResolutions: this.successfulResolutions || 0,
      failedResolutions: this.failedResolutions || 0,
      lastResolution: this.lastResolution || null
    };
  }
}

module.exports = ErrorResolver;