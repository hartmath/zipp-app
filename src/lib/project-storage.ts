"use client"

export interface Project {
  id: string
  name: string
  description?: string
  thumbnail?: string
  createdAt: Date
  updatedAt: Date
  duration: number
  fps: number
  canvasSize: {
    width: number
    height: number
  }
  timelineElements: any[]
  mediaFiles: any[]
  settings: {
    quality: 'low' | 'medium' | 'high'
    format: 'mp4' | 'webm'
    includeAudio: boolean
  }
}

export interface ProjectStorageResult {
  success: boolean
  data?: any
  error?: string
}

class ProjectStorageService {
  private dbName = 'ZipplignProjects'
  private dbVersion = 1
  private db: IDBDatabase | null = null

  async initialize(): Promise<void> {
    if (this.db) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Projects store
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' })
          projectStore.createIndex('name', 'name', { unique: false })
          projectStore.createIndex('createdAt', 'createdAt', { unique: false })
          projectStore.createIndex('updatedAt', 'updatedAt', { unique: false })
        }

        // Media files store
        if (!db.objectStoreNames.contains('mediaFiles')) {
          const mediaStore = db.createObjectStore('mediaFiles', { keyPath: 'id' })
          mediaStore.createIndex('projectId', 'projectId', { unique: false })
          mediaStore.createIndex('type', 'type', { unique: false })
        }

        // Timeline elements store
        if (!db.objectStoreNames.contains('timelineElements')) {
          const timelineStore = db.createObjectStore('timelineElements', { keyPath: 'id' })
          timelineStore.createIndex('projectId', 'projectId', { unique: false })
          timelineStore.createIndex('start', 'start', { unique: false })
        }
      }
    })
  }

  async saveProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectStorageResult> {
    try {
      await this.initialize()
      if (!this.db) throw new Error('Database not initialized')

      const projectWithMetadata: Project = {
        ...project,
        id: `project_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const transaction = this.db.transaction(['projects', 'mediaFiles', 'timelineElements'], 'readwrite')

      // Save project
      const projectStore = transaction.objectStore('projects')
      await new Promise<void>((resolve, reject) => {
        const request = projectStore.add(projectWithMetadata)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      // Save media files
      if (project.mediaFiles.length > 0) {
        const mediaStore = transaction.objectStore('mediaFiles')
        for (const mediaFile of project.mediaFiles) {
          const mediaWithProjectId = {
            ...mediaFile,
            projectId: projectWithMetadata.id
          }
          await new Promise<void>((resolve, reject) => {
            const request = mediaStore.add(mediaWithProjectId)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          })
        }
      }

      // Save timeline elements
      if (project.timelineElements.length > 0) {
        const timelineStore = transaction.objectStore('timelineElements')
        for (const element of project.timelineElements) {
          const elementWithProjectId = {
            ...element,
            projectId: projectWithMetadata.id
          }
          await new Promise<void>((resolve, reject) => {
            const request = timelineStore.add(elementWithProjectId)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          })
        }
      }

      return {
        success: true,
        data: projectWithMetadata
      }

    } catch (error) {
      console.error('Save project error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<ProjectStorageResult> {
    try {
      await this.initialize()
      if (!this.db) throw new Error('Database not initialized')

      const transaction = this.db.transaction(['projects'], 'readwrite')
      const projectStore = transaction.objectStore('projects')

      // Get existing project
      const existingProject = await new Promise<Project>((resolve, reject) => {
        const request = projectStore.get(projectId)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      if (!existingProject) {
        throw new Error('Project not found')
      }

      // Update project
      const updatedProject: Project = {
        ...existingProject,
        ...updates,
        updatedAt: new Date()
      }

      await new Promise<void>((resolve, reject) => {
        const request = projectStore.put(updatedProject)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      return {
        success: true,
        data: updatedProject
      }

    } catch (error) {
      console.error('Update project error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async loadProject(projectId: string): Promise<ProjectStorageResult> {
    try {
      await this.initialize()
      if (!this.db) throw new Error('Database not initialized')

      const transaction = this.db.transaction(['projects', 'mediaFiles', 'timelineElements'], 'readonly')

      // Load project
      const projectStore = transaction.objectStore('projects')
      const project = await new Promise<Project>((resolve, reject) => {
        const request = projectStore.get(projectId)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      if (!project) {
        throw new Error('Project not found')
      }

      // Load media files
      const mediaStore = transaction.objectStore('mediaFiles')
      const mediaIndex = mediaStore.index('projectId')
      const mediaFiles = await new Promise<any[]>((resolve, reject) => {
        const request = mediaIndex.getAll(projectId)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      // Load timeline elements
      const timelineStore = transaction.objectStore('timelineElements')
      const timelineIndex = timelineStore.index('projectId')
      const timelineElements = await new Promise<any[]>((resolve, reject) => {
        const request = timelineIndex.getAll(projectId)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      const fullProject: Project = {
        ...project,
        mediaFiles: mediaFiles.map(file => {
          const { projectId, ...fileData } = file
          return fileData
        }),
        timelineElements: timelineElements.map(element => {
          const { projectId, ...elementData } = element
          return elementData
        })
      }

      return {
        success: true,
        data: fullProject
      }

    } catch (error) {
      console.error('Load project error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async listProjects(): Promise<ProjectStorageResult> {
    try {
      await this.initialize()
      if (!this.db) throw new Error('Database not initialized')

      const transaction = this.db.transaction(['projects'], 'readonly')
      const projectStore = transaction.objectStore('projects')
      const index = projectStore.index('updatedAt')

      const projects = await new Promise<Project[]>((resolve, reject) => {
        const request = index.getAll()
        request.onsuccess = () => resolve(request.result.reverse()) // Most recent first
        request.onerror = () => reject(request.error)
      })

      return {
        success: true,
        data: projects
      }

    } catch (error) {
      console.error('List projects error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async deleteProject(projectId: string): Promise<ProjectStorageResult> {
    try {
      await this.initialize()
      if (!this.db) throw new Error('Database not initialized')

      const transaction = this.db.transaction(['projects', 'mediaFiles', 'timelineElements'], 'readwrite')

      // Delete media files
      const mediaStore = transaction.objectStore('mediaFiles')
      const mediaIndex = mediaStore.index('projectId')
      const mediaFiles = await new Promise<any[]>((resolve, reject) => {
        const request = mediaIndex.getAll(projectId)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      for (const mediaFile of mediaFiles) {
        await new Promise<void>((resolve, reject) => {
          const request = mediaStore.delete(mediaFile.id)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
      }

      // Delete timeline elements
      const timelineStore = transaction.objectStore('timelineElements')
      const timelineIndex = timelineStore.index('projectId')
      const timelineElements = await new Promise<any[]>((resolve, reject) => {
        const request = timelineIndex.getAll(projectId)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      for (const element of timelineElements) {
        await new Promise<void>((resolve, reject) => {
          const request = timelineStore.delete(element.id)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
      }

      // Delete project
      const projectStore = transaction.objectStore('projects')
      await new Promise<void>((resolve, reject) => {
        const request = projectStore.delete(projectId)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      return {
        success: true
      }

    } catch (error) {
      console.error('Delete project error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async exportProject(projectId: string): Promise<ProjectStorageResult> {
    try {
      const result = await this.loadProject(projectId)
      if (!result.success) return result

      const project = result.data as Project
      const exportData = {
        ...project,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zipplign`
      a.click()
      
      URL.revokeObjectURL(url)

      return {
        success: true
      }

    } catch (error) {
      console.error('Export project error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async importProject(file: File): Promise<ProjectStorageResult> {
    try {
      const text = await file.text()
      const importData = JSON.parse(text)

      if (!importData.name || !importData.timelineElements) {
        throw new Error('Invalid project file')
      }

      const projectData = {
        name: importData.name,
        description: importData.description || '',
        thumbnail: importData.thumbnail,
        duration: importData.duration || 60,
        fps: importData.fps || 30,
        canvasSize: importData.canvasSize || { width: 1080, height: 1920 },
        timelineElements: importData.timelineElements || [],
        mediaFiles: importData.mediaFiles || [],
        settings: importData.settings || {
          quality: 'medium',
          format: 'mp4',
          includeAudio: true
        }
      }

      return await this.saveProject(projectData)

    } catch (error) {
      console.error('Import project error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid project file'
      }
    }
  }
}

// Singleton instance
let projectStorageService: ProjectStorageService | null = null

export function getProjectStorageService(): ProjectStorageService {
  if (!projectStorageService) {
    projectStorageService = new ProjectStorageService()
  }
  return projectStorageService
}

// Utility functions
export async function saveProjectToStorage(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectStorageResult> {
  const service = getProjectStorageService()
  return await service.saveProject(project)
}

export async function loadProjectFromStorage(projectId: string): Promise<ProjectStorageResult> {
  const service = getProjectStorageService()
  return await service.loadProject(projectId)
}

export async function listProjectsFromStorage(): Promise<ProjectStorageResult> {
  const service = getProjectStorageService()
  return await service.listProjects()
}

export async function deleteProjectFromStorage(projectId: string): Promise<ProjectStorageResult> {
  const service = getProjectStorageService()
  return await service.deleteProject(projectId)
}
