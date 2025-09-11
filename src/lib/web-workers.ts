"use client"

// Web Workers for heavy computations to keep UI responsive
export class WebWorkerManager {
  private static instance: WebWorkerManager
  private workers = new Map<string, Worker>()
  private taskQueue = new Map<string, Array<{ resolve: Function; reject: Function; data: any }>>()

  static getInstance(): WebWorkerManager {
    if (!WebWorkerManager.instance) {
      WebWorkerManager.instance = new WebWorkerManager()
    }
    return WebWorkerManager.instance
  }

  // Create worker from blob URL
  private createWorker(workerCode: string): Worker {
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const workerUrl = URL.createObjectURL(blob)
    return new Worker(workerUrl)
  }

  // Image processing worker
  createImageProcessingWorker(): Worker {
    const workerCode = `
      self.onmessage = function(e) {
        const { type, data } = e.data
        
        switch (type) {
          case 'resize':
            resizeImage(data)
            break
          case 'compress':
            compressImage(data)
            break
          case 'filter':
            applyFilter(data)
            break
          case 'background-removal':
            removeBackground(data)
            break
        }
      }
      
      function resizeImage({ imageData, width, height, quality }) {
        const canvas = new OffscreenCanvas(width, height)
        const ctx = canvas.getContext('2d')
        
        // Create image from data
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height)
          canvas.convertToBlob({ type: 'image/jpeg', quality })
            .then(blob => {
              self.postMessage({ type: 'resize-complete', blob })
            })
        }
        img.src = imageData
      }
      
      function compressImage({ imageData, quality }) {
        const canvas = new OffscreenCanvas(1, 1)
        const ctx = canvas.getContext('2d')
        
        const img = new Image()
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
          canvas.convertToBlob({ type: 'image/jpeg', quality })
            .then(blob => {
              self.postMessage({ type: 'compress-complete', blob })
            })
        }
        img.src = imageData
      }
      
      function applyFilter({ imageData, filter }) {
        const canvas = new OffscreenCanvas(1, 1)
        const ctx = canvas.getContext('2d')
        
        const img = new Image()
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
          
          // Apply filter
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data
          
          switch (filter) {
            case 'grayscale':
              for (let i = 0; i < data.length; i += 4) {
                const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
                data[i] = gray
                data[i + 1] = gray
                data[i + 2] = gray
              }
              break
            case 'sepia':
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i]
                const g = data[i + 1]
                const b = data[i + 2]
                data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189))
                data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168))
                data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131))
              }
              break
            case 'brightness':
              const brightness = 1.2
              for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * brightness)
                data[i + 1] = Math.min(255, data[i + 1] * brightness)
                data[i + 2] = Math.min(255, data[i + 2] * brightness)
              }
              break
          }
          
          ctx.putImageData(imageData, 0, 0)
          canvas.convertToBlob({ type: 'image/png' })
            .then(blob => {
              self.postMessage({ type: 'filter-complete', blob })
            })
        }
        img.src = imageData
      }
      
      function removeBackground({ imageData, color, tolerance }) {
        const canvas = new OffscreenCanvas(1, 1)
        const ctx = canvas.getContext('2d')
        
        const img = new Image()
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data
          
          // Convert color to RGB
          const targetR = parseInt(color.slice(1, 3), 16)
          const targetG = parseInt(color.slice(3, 5), 16)
          const targetB = parseInt(color.slice(5, 7), 16)
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            
            const distance = Math.sqrt(
              Math.pow(r - targetR, 2) +
              Math.pow(g - targetG, 2) +
              Math.pow(b - targetB, 2)
            )
            
            if (distance < tolerance) {
              data[i + 3] = 0 // Make transparent
            }
          }
          
          ctx.putImageData(imageData, 0, 0)
          canvas.convertToBlob({ type: 'image/png' })
            .then(blob => {
              self.postMessage({ type: 'background-removal-complete', blob })
            })
        }
        img.src = imageData
      }
    `

    const worker = this.createWorker(workerCode)
    this.workers.set('image-processing', worker)
    return worker
  }

  // Audio processing worker
  createAudioProcessingWorker(): Worker {
    const workerCode = `
      self.onmessage = function(e) {
        const { type, data } = e.data
        
        switch (type) {
          case 'compress':
            compressAudio(data)
            break
          case 'normalize':
            normalizeAudio(data)
            break
          case 'filter':
            applyAudioFilter(data)
            break
        }
      }
      
      function compressAudio({ audioData, bitrate }) {
        // Audio compression logic
        self.postMessage({ type: 'compress-complete', audioData })
      }
      
      function normalizeAudio({ audioData }) {
        // Audio normalization logic
        self.postMessage({ type: 'normalize-complete', audioData })
      }
      
      function applyAudioFilter({ audioData, filter }) {
        // Audio filter logic
        self.postMessage({ type: 'filter-complete', audioData })
      }
    `

    const worker = this.createWorker(workerCode)
    this.workers.set('audio-processing', worker)
    return worker
  }

  // Video processing worker
  createVideoProcessingWorker(): Worker {
    const workerCode = `
      self.onmessage = function(e) {
        const { type, data } = e.data
        
        switch (type) {
          case 'compress':
            compressVideo(data)
            break
          case 'resize':
            resizeVideo(data)
            break
          case 'extract-frames':
            extractFrames(data)
            break
        }
      }
      
      function compressVideo({ videoData, quality }) {
        // Video compression logic
        self.postMessage({ type: 'compress-complete', videoData })
      }
      
      function resizeVideo({ videoData, width, height }) {
        // Video resize logic
        self.postMessage({ type: 'resize-complete', videoData })
      }
      
      function extractFrames({ videoData, frameRate }) {
        // Frame extraction logic
        self.postMessage({ type: 'extract-frames-complete', frames: [] })
      }
    `

    const worker = this.createWorker(workerCode)
    this.workers.set('video-processing', worker)
    return worker
  }

  // Process image in worker
  async processImage(type: string, data: any): Promise<any> {
    const worker = this.workers.get('image-processing') || this.createImageProcessingWorker()
    
    return new Promise((resolve, reject) => {
      const taskId = Math.random().toString(36)
      
      if (!this.taskQueue.has('image-processing')) {
        this.taskQueue.set('image-processing', [])
      }
      
      this.taskQueue.get('image-processing')!.push({ resolve, reject, data })
      
      worker.onmessage = (e) => {
        const { type: responseType, blob } = e.data
        if (responseType === `${type}-complete`) {
          const tasks = this.taskQueue.get('image-processing') || []
          const task = tasks.shift()
          if (task) {
            task.resolve(blob)
          }
        }
      }
      
      worker.postMessage({ type, data })
    })
  }

  // Process audio in worker
  async processAudio(type: string, data: any): Promise<any> {
    const worker = this.workers.get('audio-processing') || this.createAudioProcessingWorker()
    
    return new Promise((resolve, reject) => {
      const taskId = Math.random().toString(36)
      
      if (!this.taskQueue.has('audio-processing')) {
        this.taskQueue.set('audio-processing', [])
      }
      
      this.taskQueue.get('audio-processing')!.push({ resolve, reject, data })
      
      worker.onmessage = (e) => {
        const { type: responseType, audioData } = e.data
        if (responseType === `${type}-complete`) {
          const tasks = this.taskQueue.get('audio-processing') || []
          const task = tasks.shift()
          if (task) {
            task.resolve(audioData)
          }
        }
      }
      
      worker.postMessage({ type, data })
    })
  }

  // Process video in worker
  async processVideo(type: string, data: any): Promise<any> {
    const worker = this.workers.get('video-processing') || this.createVideoProcessingWorker()
    
    return new Promise((resolve, reject) => {
      const taskId = Math.random().toString(36)
      
      if (!this.taskQueue.has('video-processing')) {
        this.taskQueue.set('video-processing', [])
      }
      
      this.taskQueue.get('video-processing')!.push({ resolve, reject, data })
      
      worker.onmessage = (e) => {
        const { type: responseType, videoData } = e.data
        if (responseType === `${type}-complete`) {
          const tasks = this.taskQueue.get('video-processing') || []
          const task = tasks.shift()
          if (task) {
            task.resolve(videoData)
          }
        }
      }
      
      worker.postMessage({ type, data })
    })
  }

  // Cleanup workers
  cleanup() {
    this.workers.forEach(worker => {
      worker.terminate()
    })
    this.workers.clear()
    this.taskQueue.clear()
  }
}

// Export singleton instance
export const webWorkerManager = WebWorkerManager.getInstance()
