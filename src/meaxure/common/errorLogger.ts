// Copyright 2020 Jebbs. All rights reserved.
// Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.

import { sketch } from "../../sketch";

// macOS API declarations for file operations
declare const NSHomeDirectory: () => any;
declare const NSString: any;
declare const NSUTF8StringEncoding: any;

export interface ErrorLogEntry {
    timestamp: string;
    level: 'ERROR' | 'WARN' | 'INFO';
    message: string;
    details?: string;
    layerName?: string;
    artboardName?: string;
    stackTrace?: string;
}

class ErrorLogger {
    private logs: ErrorLogEntry[] = [];
    private maxLogs = 1000; // Keep last 1000 log entries

    log(level: 'ERROR' | 'WARN' | 'INFO', message: string, details?: string, layerName?: string, artboardName?: string, error?: Error) {
        const entry: ErrorLogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            details,
            layerName,
            artboardName,
            stackTrace: error?.stack
        };

        this.logs.push(entry);
        
        // Keep only the last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Also log to console for immediate debugging
        const consoleMessage = `[${level}] ${message}${details ? ` - ${details}` : ''}${layerName ? ` (Layer: ${layerName})` : ''}`;
        
        switch (level) {
            case 'ERROR':
                console.error(consoleMessage, error);
                break;
            case 'WARN':
                console.warn(consoleMessage);
                break;
            case 'INFO':
                console.info(consoleMessage);
                break;
        }
    }

    error(message: string, details?: string, layerName?: string, artboardName?: string, error?: Error) {
        this.log('ERROR', message, details, layerName, artboardName, error);
    }

    warn(message: string, details?: string, layerName?: string, artboardName?: string) {
        this.log('WARN', message, details, layerName, artboardName);
    }

    info(message: string, details?: string, layerName?: string, artboardName?: string) {
        this.log('INFO', message, details, layerName, artboardName);
    }

    getLogs(): ErrorLogEntry[] {
        return [...this.logs];
    }

    getLogsAsText(): string {
        return this.logs.map(log => {
            let line = `[${log.timestamp}] [${log.level}] ${log.message}`;
            if (log.details) line += ` - ${log.details}`;
            if (log.layerName) line += ` (Layer: ${log.layerName})`;
            if (log.artboardName) line += ` (Artboard: ${log.artboardName})`;
            if (log.stackTrace) line += `\nStack: ${log.stackTrace}`;
            return line;
        }).join('\n');
    }

    exportLogsToDesktop(): boolean {
        try {
            const desktopPath = NSHomeDirectory().stringByAppendingPathComponent("Desktop");
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `sketch-meaxure-logs-${timestamp}.txt`;
            const filePath = desktopPath.stringByAppendingPathComponent(filename);
            
            const logsContent = this.getLogsAsText();
            const header = `Sketch Meaxure Error Logs\nGenerated: ${new Date().toISOString()}\nPlugin Version: 3.3.5\n${'='.repeat(50)}\n\n`;
            const fullContent = header + logsContent;
            
            const nsString = NSString.stringWithString(fullContent);
            const success = nsString.writeToFile_atomically_encoding_error(
                filePath,
                true,
                NSUTF8StringEncoding,
                null
            );

            if (success) {
                sketch.UI.message(`Logs exported to Desktop: ${filename}`);
                this.info('Logs exported successfully', `File: ${filename}`);
                return true;
            } else {
                this.error('Failed to export logs', 'File write operation failed');
                return false;
            }
        } catch (error) {
            this.error('Exception during log export', error.message, undefined, undefined, error);
            sketch.UI.message('Failed to export logs - check console for details');
            return false;
        }
    }

    exportLogsToDocuments(): boolean {
        try {
            const documentsPath = NSHomeDirectory().stringByAppendingPathComponent("Documents");
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `sketch-meaxure-logs-${timestamp}.txt`;
            const filePath = documentsPath.stringByAppendingPathComponent(filename);
            
            const logsContent = this.getLogsAsText();
            const header = `Sketch Meaxure Error Logs\nGenerated: ${new Date().toISOString()}\nPlugin Version: 3.3.5\n${'='.repeat(50)}\n\n`;
            const fullContent = header + logsContent;
            
            const nsString = NSString.stringWithString(fullContent);
            const success = nsString.writeToFile_atomically_encoding_error(
                filePath,
                true,
                NSUTF8StringEncoding,
                null
            );

            if (success) {
                sketch.UI.message(`Logs exported to Documents: ${filename}`);
                this.info('Logs exported successfully', `File: ${filename}`);
                return true;
            } else {
                this.error('Failed to export logs', 'File write operation failed');
                return false;
            }
        } catch (error) {
            this.error('Exception during log export', error.message, undefined, undefined, error);
            sketch.UI.message('Failed to export logs - check console for details');
            return false;
        }
    }

    clear() {
        this.logs = [];
        this.info('Error logs cleared');
    }

    getLogCount(): number {
        return this.logs.length;
    }

    getErrorCount(): number {
        return this.logs.filter(log => log.level === 'ERROR').length;
    }

    getWarningCount(): number {
        return this.logs.filter(log => log.level === 'WARN').length;
    }
}

// Global error logger instance
export const errorLogger = new ErrorLogger();

// Export logs command for menu integration
export function exportErrorLogs() {
    const logCount = errorLogger.getLogCount();
    if (logCount === 0) {
        sketch.UI.message('No logs to export');
        return;
    }

    const errorCount = errorLogger.getErrorCount();
    const warningCount = errorLogger.getWarningCount();
    
    sketch.UI.message(`Exporting ${logCount} log entries (${errorCount} errors, ${warningCount} warnings)...`);
    
    // Try Desktop first, fallback to Documents
    if (!errorLogger.exportLogsToDesktop()) {
        errorLogger.exportLogsToDocuments();
    }
}
