import FS from '@isomorphic-git/lightning-fs'

/**
 * File system manager using LightningFS
 */
class FileSystemManager {
  constructor() {
    this.fs = new FS('redactify')
    this.pfs = this.fs.promises
    this.initialized = false
  }

  async init() {
    if (this.initialized) return
    
    try {
      // Create base directories
      await this.ensureDir('/original')
      await this.ensureDir('/redacted')
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize file system:', error)
    }
  }

  async ensureDir(path) {
    try {
      await this.pfs.mkdir(path)
    } catch (error) {
      // Directory might already exist
      if (error.code !== 'EEXIST') {
        throw error
      }
    }
  }

  async writeFile(path, content) {
    await this.init()
    const dir = path.substring(0, path.lastIndexOf('/'))
    if (dir) {
      await this.ensureDir(dir)
    }
    await this.pfs.writeFile(path, content, 'utf8')
  }

  async readFile(path) {
    await this.init()
    return await this.pfs.readFile(path, 'utf8')
  }

  async listFiles(dir = '/') {
    await this.init()
    try {
      const files = await this.pfs.readdir(dir)
      const fileStats = await Promise.all(
        files.map(async (name) => {
          const fullPath = `${dir}/${name}`.replace('//', '/')
          const stat = await this.pfs.stat(fullPath)
          return {
            name,
            path: fullPath,
            isDirectory: stat.type === 'dir',
            size: stat.size,
            modified: stat.mtimeMs
          }
        })
      )
      return fileStats
    } catch (error) {
      console.error('Failed to list files:', error)
      return []
    }
  }

  async deleteFile(path) {
    await this.init()
    await this.pfs.unlink(path)
  }

  async exists(path) {
    await this.init()
    try {
      await this.pfs.stat(path)
      return true
    } catch {
      return false
    }
  }

  async saveOriginalFile(fileName, content) {
    const path = `/original/${fileName}`
    await this.writeFile(path, content)
    return path
  }

  async saveRedactedFile(fileName, content) {
    const path = `/redacted/${fileName}`
    await this.writeFile(path, content)
    return path
  }

  async getOriginalFiles() {
    return await this.listFiles('/original')
  }

  async getRedactedFiles() {
    return await this.listFiles('/redacted')
  }

  async clear() {
    await this.init()
    try {
      const originalFiles = await this.getOriginalFiles()
      const redactedFiles = await this.getRedactedFiles()
      
      await Promise.all([
        ...originalFiles.map(f => this.deleteFile(f.path)),
        ...redactedFiles.map(f => this.deleteFile(f.path))
      ])
    } catch (error) {
      console.error('Failed to clear file system:', error)
    }
  }

  /**
   * Export all redacted files as a zip (returns file data)
   */
  async exportRedactedFiles() {
    const files = await this.getRedactedFiles()
    const fileContents = await Promise.all(
      files.filter(f => !f.isDirectory).map(async (file) => ({
        name: file.name,
        content: await this.readFile(file.path)
      }))
    )
    return fileContents
  }
}

// Singleton instance
const fileSystemManager = new FileSystemManager()

export default fileSystemManager
