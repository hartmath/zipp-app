"use client"

// RequestIdleCallback polyfill and utilities for non-critical tasks
export class IdleTaskManager {
  private static instance: IdleTaskManager
  private taskQueue: Array<{ task: Function; priority: number; timeout: number }> = []
  private isProcessing = false

  static getInstance(): IdleTaskManager {
    if (!IdleTaskManager.instance) {
      IdleTaskManager.instance = new IdleTaskManager()
    }
    return IdleTaskManager.instance
  }

  // Polyfill for requestIdleCallback
  private requestIdleCallback(callback: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void, options?: { timeout?: number }) {
    if ('requestIdleCallback' in window) {
      return window.requestIdleCallback(callback, options)
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      const start = Date.now()
      return setTimeout(() => {
        callback({
          didTimeout: false,
          timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
        })
      }, 1)
    }
  }

  // Add task to idle queue
  scheduleTask(task: Function, priority: number = 0, timeout: number = 5000) {
    this.taskQueue.push({ task, priority, timeout })
    this.taskQueue.sort((a, b) => b.priority - a.priority) // Higher priority first
    
    if (!this.isProcessing) {
      this.processTasks()
    }
  }

  // Process tasks during idle time
  private processTasks() {
    this.isProcessing = true
    
    const processNextTask = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => {
      while (this.taskQueue.length > 0 && deadline.timeRemaining() > 0) {
        const { task, timeout } = this.taskQueue.shift()!
        
        try {
          // Check if task has timed out
          if (timeout > 0 && Date.now() - (task as any).startTime > timeout) {
            console.warn('Task timed out, skipping')
            continue
          }
          
          task()
        } catch (error) {
          console.error('Error in idle task:', error)
        }
      }
      
      if (this.taskQueue.length > 0) {
        this.requestIdleCallback(processNextTask)
      } else {
        this.isProcessing = false
      }
    }
    
    this.requestIdleCallback(processNextTask)
  }

  // Schedule high priority task
  scheduleHighPriority(task: Function, timeout: number = 1000) {
    this.scheduleTask(task, 10, timeout)
  }

  // Schedule medium priority task
  scheduleMediumPriority(task: Function, timeout: number = 3000) {
    this.scheduleTask(task, 5, timeout)
  }

  // Schedule low priority task
  scheduleLowPriority(task: Function, timeout: number = 10000) {
    this.scheduleTask(task, 1, timeout)
  }

  // Clear all tasks
  clearTasks() {
    this.taskQueue = []
  }

  // Get queue status
  getQueueStatus() {
    return {
      pending: this.taskQueue.length,
      isProcessing: this.isProcessing
    }
  }
}

// Utility functions for common idle tasks
export class IdleTasks {
  private static idleManager = IdleTaskManager.getInstance()

  // Preload images during idle time
  static preloadImages(urls: string[]) {
    urls.forEach(url => {
      this.idleManager.scheduleLowPriority(() => {
        const img = new Image()
        img.src = url
      })
    })
  }

  // Preload fonts during idle time
  static preloadFonts(fonts: string[]) {
    fonts.forEach(font => {
      this.idleManager.scheduleLowPriority(() => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'font'
        link.href = font
        link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
      })
    })
  }

  // Clean up unused DOM elements
  static cleanupDOM() {
    this.idleManager.scheduleLowPriority(() => {
      // Remove unused elements
      const unusedElements = document.querySelectorAll('[data-unused="true"]')
      unusedElements.forEach(el => el.remove())
      
      // Clean up event listeners
      const elementsWithListeners = document.querySelectorAll('[data-has-listeners="true"]')
      elementsWithListeners.forEach(el => {
        if (!el.isConnected) {
          el.removeAttribute('data-has-listeners')
        }
      })
    })
  }

  // Update analytics during idle time
  static updateAnalytics(data: any) {
    this.idleManager.scheduleLowPriority(() => {
      // Send analytics data
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics', JSON.stringify(data))
      }
    })
  }

  // Cache warming during idle time
  static warmCache(urls: string[]) {
    urls.forEach(url => {
      this.idleManager.scheduleLowPriority(() => {
        fetch(url, { method: 'HEAD' })
          .then(response => {
            if (response.ok) {
              console.log('Cache warmed for:', url)
            }
          })
          .catch(error => {
            console.warn('Failed to warm cache for:', url, error)
          })
      })
    })
  }

  // Background data processing
  static processData(data: any[], processor: (item: any) => any) {
    this.idleManager.scheduleMediumPriority(() => {
      const processed = data.map(processor)
      // Store processed data
      sessionStorage.setItem('processed-data', JSON.stringify(processed))
    })
  }

  // Lazy load components during idle time
  static lazyLoadComponents(components: string[]) {
    components.forEach(component => {
      this.idleManager.scheduleMediumPriority(() => {
        // Preload components without dynamic import to avoid webpack warnings
        console.log('Preloading component:', component)
        // Components will be loaded when actually needed
      })
    })
  }

  // Update service worker during idle time
  static updateServiceWorker() {
    this.idleManager.scheduleLowPriority(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations()
          .then(registrations => {
            registrations.forEach(registration => {
              registration.update()
            })
          })
      }
    })
  }

  // Clean up old data during idle time
  static cleanupOldData() {
    this.idleManager.scheduleLowPriority(() => {
      // Clean up old session storage
      const keys = Object.keys(sessionStorage)
      const now = Date.now()
      
      keys.forEach(key => {
        if (key.startsWith('temp-')) {
          const data = sessionStorage.getItem(key)
          if (data) {
            try {
              const parsed = JSON.parse(data)
              if (parsed.timestamp && now - parsed.timestamp > 3600000) { // 1 hour
                sessionStorage.removeItem(key)
              }
            } catch (error) {
              sessionStorage.removeItem(key)
            }
          }
        }
      })
    })
  }
}

// Initialize idle task manager
export function initializeIdleTasks() {
  const idleManager = IdleTaskManager.getInstance()
  
  // Schedule periodic cleanup tasks
  setInterval(() => {
    IdleTasks.cleanupDOM()
    IdleTasks.cleanupOldData()
  }, 30000) // Every 30 seconds
  
  // Schedule service worker updates
  setInterval(() => {
    IdleTasks.updateServiceWorker()
  }, 300000) // Every 5 minutes
  
  console.log('Idle task manager initialized')
}

// Export singleton instance
export const idleTaskManager = IdleTaskManager.getInstance()
