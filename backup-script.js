const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

class ApplicationBackup {
    constructor() {
        this.projectRoot = process.cwd();
        this.backupDir = path.join(this.projectRoot, 'backups');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.backupName = `app-backup-${this.timestamp}`;
    }

    async createBackup() {
        try {
            console.log('🔄 Starting application backup process...');
            
            // Ensure backup directory exists
            if (!fs.existsSync(this.backupDir)) {
                fs.mkdirSync(this.backupDir, { recursive: true });
            }

            // Create backup info
            const backupInfo = {
                timestamp: new Date().toISOString(),
                version: this.getPackageVersion(),
                gitCommit: this.getGitCommit(),
                nodeVersion: process.version,
                platform: process.platform,
                files: [],
                excludedPaths: [
                    'node_modules',
                    'backups',
                    '.git',
                    'uploads',
                    '*.log',
                    '.env',
                    'dist',
                    'build'
                ]
            };

            // Create archive
            const archivePath = path.join(this.backupDir, `${this.backupName}.zip`);
            await this.createArchive(archivePath, backupInfo);

            // Save backup metadata
            const metadataPath = path.join(this.backupDir, `${this.backupName}-metadata.json`);
            fs.writeFileSync(metadataPath, JSON.stringify(backupInfo, null, 2));

            console.log('✅ Backup completed successfully!');
            console.log(`📦 Archive: ${archivePath}`);
            console.log(`📋 Metadata: ${metadataPath}`);
            
            return {
                success: true,
                archivePath,
                metadataPath,
                backupInfo
            };

        } catch (error) {
            console.error('❌ Backup failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createArchive(archivePath, backupInfo) {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(archivePath);
            const archive = archiver('zip', {
                zlib: { level: 9 } // Maximum compression
            });

            output.on('close', () => {
                console.log(`📦 Archive created: ${archive.pointer()} total bytes`);
                resolve();
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);

            // Add files to archive
            const filesToBackup = this.getFilesToBackup();
            filesToBackup.forEach(file => {
                const relativePath = path.relative(this.projectRoot, file);
                if (fs.statSync(file).isDirectory()) {
                    archive.directory(file, relativePath);
                } else {
                    archive.file(file, { name: relativePath });
                }
                backupInfo.files.push(relativePath);
            });

            // Add backup info to archive
            archive.append(JSON.stringify(backupInfo, null, 2), { name: 'backup-info.json' });

            archive.finalize();
        });
    }

    getFilesToBackup() {
        const files = [];
        const excludePatterns = [
            /node_modules/,
            /\.git/,
            /backups/,
            /uploads/,
            /\.env$/,
            /\.log$/,
            /dist/,
            /build/,
            /coverage/,
            /\.nyc_output/
        ];

        const scanDirectory = (dir) => {
            const items = fs.readdirSync(dir);
            
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const relativePath = path.relative(this.projectRoot, fullPath);
                
                // Check if should be excluded
                const shouldExclude = excludePatterns.some(pattern => 
                    pattern.test(relativePath) || pattern.test(item)
                );
                
                if (!shouldExclude) {
                    if (fs.statSync(fullPath).isDirectory()) {
                        scanDirectory(fullPath);
                    }
                    files.push(fullPath);
                }
            });
        };

        scanDirectory(this.projectRoot);
        return files;
    }

    getPackageVersion() {
        try {
            const packagePath = path.join(this.projectRoot, 'package.json');
            if (fs.existsSync(packagePath)) {
                const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                return pkg.version || '1.0.0';
            }
        } catch (error) {
            console.warn('Could not read package version:', error.message);
        }
        return '1.0.0';
    }

    getGitCommit() {
        try {
            return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        } catch (error) {
            return 'no-git-commit';
        }
    }

    static async run() {
        const backup = new ApplicationBackup();
        const result = await backup.createBackup();
        
        if (result.success) {
            console.log('\n🎉 Backup process completed successfully!');
            console.log('Ready for Git commit and GitHub push.');
        } else {
            console.error('\n💥 Backup process failed!');
            process.exit(1);
        }
        
        return result;
    }
}

// Run backup if called directly
if (require.main === module) {
    ApplicationBackup.run().catch(console.error);
}

module.exports = ApplicationBackup;