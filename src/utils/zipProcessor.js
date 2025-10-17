import JSZip from 'jszip';
import { redactCode, detectLanguage } from './redactor';

/**
 * Determines if a file should be processed based on its path and extension
 */
function shouldProcessFile(filename) {
  // Skip common binary and non-code files
  const skipExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg', '.webp',
    '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
    '.exe', '.dll', '.so', '.dylib',
    '.mp3', '.mp4', '.avi', '.mov',
    '.ttf', '.woff', '.woff2', '.eot',
    '.lock', '.min.js', '.min.css'
  ];
  
  // Skip hidden files and common directories
  const skipPatterns = [
    /node_modules\//,
    /\.git\//,
    /dist\//,
    /build\//,
    /\.next\//,
    /\.vscode\//,
    /\.idea\//,
    /coverage\//,
    /__pycache__\//,
    /\.pytest_cache\//,
    /\.DS_Store/,
    /thumbs\.db/i
  ];
  
  const lowerFilename = filename.toLowerCase();
  
  // Check if file has a skip extension
  if (skipExtensions.some(ext => lowerFilename.endsWith(ext))) {
    return false;
  }
  
  // Check if file matches skip patterns
  if (skipPatterns.some(pattern => pattern.test(filename))) {
    return false;
  }
  
  return true;
}

/**
 * Processes a zip file and redacts all code files within it
 * @param {File} zipFile - The uploaded zip file
 * @param {Object} settings - Redaction settings
 * @param {Function} onProgress - Callback for progress updates (current, total, filename)
 * @returns {Promise<{blob: Blob, stats: Object}>}
 */
export async function processZipFile(zipFile, settings, onProgress) {
  const zip = new JSZip();
  const outputZip = new JSZip();
  
  // Load the zip file
  const zipData = await zip.loadAsync(zipFile);
  
  // Get all files to process
  const allFiles = [];
  zipData.forEach((relativePath, file) => {
    if (!file.dir) {
      allFiles.push({ relativePath, file });
    }
  });
  
  const totalFiles = allFiles.length;
  let processedCount = 0;
  let redactedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const allChanges = [];
  
  // Process each file
  for (const { relativePath, file } of allFiles) {
    processedCount++;
    
    if (onProgress) {
      onProgress(processedCount, totalFiles, relativePath);
    }
    
    try {
      // Check if file should be processed
      if (!shouldProcessFile(relativePath)) {
        // Copy binary/skip files as-is
        const content = await file.async('arraybuffer');
        outputZip.file(relativePath, content);
        skippedCount++;
        continue;
      }
      
      // Try to read as text
      let content;
      try {
        content = await file.async('text');
      } catch (err) {
        // If can't read as text, copy as binary
        const binaryContent = await file.async('arraybuffer');
        outputZip.file(relativePath, binaryContent);
        skippedCount++;
        continue;
      }
      
      // Detect language and redact
      const language = detectLanguage(relativePath);
      const result = redactCode(content, {
        ...settings,
        language
      });
      
      // Add redacted file to output zip
      outputZip.file(relativePath, result.redactedCode);
      redactedCount++;
      
      // Collect changes
      if (result.changes.length > 0) {
        allChanges.push({
          file: relativePath,
          changes: result.changes,
          summary: result.summary
        });
      }
    } catch (error) {
      console.error(`Error processing ${relativePath}:`, error);
      // On error, try to copy original file
      try {
        const content = await file.async('arraybuffer');
        outputZip.file(relativePath, content);
      } catch (copyError) {
        console.error(`Failed to copy ${relativePath}:`, copyError);
      }
      errorCount++;
    }
  }
  
  // Generate the output zip
  const blob = await outputZip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
  
  // Calculate aggregate stats
  const stats = {
    totalFiles,
    processedCount,
    redactedCount,
    skippedCount,
    errorCount,
    totalSecrets: allChanges.reduce((sum, f) => sum + f.summary.secretsRedacted, 0),
    totalVariables: allChanges.reduce((sum, f) => sum + f.summary.variablesRedacted, 0),
    totalClasses: allChanges.reduce((sum, f) => sum + f.summary.classesRedacted, 0),
    totalFunctions: allChanges.reduce((sum, f) => sum + f.summary.functionsRedacted, 0),
    totalUrls: allChanges.reduce((sum, f) => sum + f.summary.urlsRedacted, 0),
    totalChanges: allChanges.reduce((sum, f) => sum + f.summary.totalChanges, 0),
    fileDetails: allChanges
  };
  
  return { blob, stats };
}

/**
 * Validates if a file is a valid zip file
 */
export async function isValidZipFile(file) {
  try {
    const zip = new JSZip();
    await zip.loadAsync(file);
    return true;
  } catch (error) {
    return false;
  }
}
