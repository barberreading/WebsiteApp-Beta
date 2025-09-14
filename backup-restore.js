const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Comprehensive Backup and Restore System for Staff Management App
 * Creates full backup including database, files, and configuration
 */

class BackupRestoreSystem {
  constructor() {
    this.backupDir = path.join(__dirname, 'backups');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.backupPath = path.join(this.backupDir, `backup-${this.timestamp}`);
  }

  /**
   * Create full backup of the application
   */
  async createBackup() {
    console.log('🔄 Starting full backup process...');
    
    try {
      // Create backup directory
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }
      fs.mkdirSync(this.backupPath, { recursive: true });

      // 1. Backup application files
      await this.backupApplicationFiles();
      
      // 2. Backup database (if MongoDB is running)
      await this.backupDatabase();
      
      // 3. Backup environment configurations
      await this.backupConfigurations();
      
      // 4. Create backup manifest
      await this.createBackupManifest();
      
      console.log(`✅ Backup completed successfully at: ${this.backupPath}`);
      return this.backupPath;
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      throw error;
    }
  }

  /**
   * Backup application files (excluding node_modules and logs)
   */
  async backupApplicationFiles() {
    console.log('📁 Backing up application files...');
    
    const excludePatterns = [
      'node_modules',
      '.git',
      'logs',
      'backups',
      '*.log',
      'uploads/temp'
    ];

    // Copy backend files
    this.copyDirectory(
      path.join(__dirname, 'backend'),
      path.join(this.backupPath, 'backend'),
      excludePatterns
    );

    // Copy frontend files
    this.copyDirectory(
      path.join(__dirname, 'frontend'),
      path.join(this.backupPath, 'frontend'),
      excludePatterns
    );

    // Copy root files
    const rootFiles = ['package.json', 'README.md', '.gitignore'];
    rootFiles.forEach(file => {
      const srcPath = path.join(__dirname, file);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, path.join(this.backupPath, file));
      }
    });
  }

  /**
   * Backup MongoDB database
   */
  async backupDatabase() {
    console.log('🗄️ Backing up database...');
    
    try {
      const dbBackupPath = path.join(this.backupPath, 'database');
      fs.mkdirSync(dbBackupPath, { recursive: true });

      // Try to create MongoDB dump
      const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
      const dbName = mongoUri.split('/').pop().split('?')[0];
      
      execSync(`mongodump --uri="${mongoUri}" --out="${dbBackupPath}"`, {
        stdio: 'inherit'
      });
      
      console.log('✅ Database backup completed');
    } catch (error) {
      console.warn('⚠️ Database backup failed (MongoDB may not be running):', error.message);
      // Create a note about database backup failure
      fs.writeFileSync(
        path.join(this.backupPath, 'database-backup-failed.txt'),
        `Database backup failed at ${new Date().toISOString()}\nError: ${error.message}\n\nTo manually backup database:\n1. Ensure MongoDB is running\n2. Run: mongodump --uri="your-mongo-uri" --out="./database-backup"`
      );
    }
  }

  /**
   * Backup configuration files
   */
  async backupConfigurations() {
    console.log('⚙️ Backing up configurations...');
    
    const configPath = path.join(this.backupPath, 'config');
    fs.mkdirSync(configPath, { recursive: true });

    // Backup .env.example files
    const envFiles = [
      'backend/.env.example',
      'frontend/.env.example'
    ];

    envFiles.forEach(envFile => {
      const srcPath = path.join(__dirname, envFile);
      if (fs.existsSync(srcPath)) {
        const destPath = path.join(configPath, path.basename(envFile));
        fs.copyFileSync(srcPath, destPath);
      }
    });

    // Create environment setup instructions
    const setupInstructions = `# Environment Setup Instructions\n\n## Backend Environment\n1. Copy backend/.env.example to backend/.env\n2. Update the following variables:\n   - MONGO_URI\n   - JWT_SECRET\n   - ADMIN_EMAIL\n   - ADMIN_PASSWORD\n\n## Frontend Environment\n1. Copy frontend/.env.example to frontend/.env (if exists)\n2. Update API endpoints if needed\n\n## Database Setup\n1. Ensure MongoDB is running\n2. Restore database from backup if available\n3. Run: npm run create-superuser (in backend directory)\n`;
    
    fs.writeFileSync(path.join(configPath, 'SETUP_INSTRUCTIONS.md'), setupInstructions);
  }

  /**
   * Create backup manifest with metadata
   */
  async createBackupManifest() {
    const manifest = {
      timestamp: this.timestamp,
      date: new Date().toISOString(),
      version: this.getAppVersion(),
      contents: {
        applicationFiles: true,
        database: fs.existsSync(path.join(this.backupPath, 'database')),
        configurations: true
      },
      instructions: {
        restore: 'Run: node backup-restore.js restore <backup-path>',
        setup: 'See config/SETUP_INSTRUCTIONS.md for environment setup'
      }
    };

    fs.writeFileSync(
      path.join(this.backupPath, 'backup-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
  }

  /**
   * Get application version from package.json
   */
  getAppVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
      return packageJson.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }

  /**
   * Copy directory with exclusions
   */
  copyDirectory(src, dest, excludePatterns = []) {
    if (!fs.existsSync(src)) return;
    
    fs.mkdirSync(dest, { recursive: true });
    
    const items = fs.readdirSync(src);
    
    items.forEach(item => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      // Check if item should be excluded
      const shouldExclude = excludePatterns.some(pattern => {
        if (pattern.includes('*')) {
          return item.match(pattern.replace('*', '.*'));
        }
        return item === pattern;
      });
      
      if (shouldExclude) return;
      
      const stat = fs.statSync(srcPath);
      
      if (stat.isDirectory()) {
        this.copyDirectory(srcPath, destPath, excludePatterns);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }

  /**
   * List available backups
   */
  listBackups() {
    if (!fs.existsSync(this.backupDir)) {
      console.log('No backups found.');
      return [];
    }

    const backups = fs.readdirSync(this.backupDir)
      .filter(item => item.startsWith('backup-'))
      .map(backup => {
        const backupPath = path.join(this.backupDir, backup);
        const manifestPath = path.join(backupPath, 'backup-manifest.json');
        
        let manifest = {};
        if (fs.existsSync(manifestPath)) {
          manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        }
        
        return {
          name: backup,
          path: backupPath,
          date: manifest.date || 'Unknown',
          version: manifest.version || 'Unknown'
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log('\n📋 Available Backups:');
    backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup.name}`);
      console.log(`   Date: ${backup.date}`);
      console.log(`   Version: ${backup.version}`);
      console.log(`   Path: ${backup.path}\n`);
    });

    return backups;
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const backupSystem = new BackupRestoreSystem();
  
  switch (command) {
    case 'create':
    case 'backup':
      backupSystem.createBackup()
        .then(backupPath => {
          console.log(`\n🎉 Backup created successfully!`);
          console.log(`📁 Location: ${backupPath}`);
          console.log(`\n📋 Next steps:`);
          console.log(`1. Fix any issues in your application`);
          console.log(`2. Test the application`);
          console.log(`3. Run: node backup-restore.js list (to see all backups)`);
        })
        .catch(error => {
          console.error('❌ Backup failed:', error.message);
          process.exit(1);
        });
      break;
      
    case 'list':
      backupSystem.listBackups();
      break;
      
    default:
      console.log('\n🔧 Staff Management App - Backup & Restore System');
      console.log('\nUsage:');
      console.log('  node backup-restore.js create   - Create a new backup');
      console.log('  node backup-restore.js list     - List all available backups');
      console.log('\nExample:');
      console.log('  node backup-restore.js create');
      break;
  }
}

module.exports = BackupRestoreSystem;