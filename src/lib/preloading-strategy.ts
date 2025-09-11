"use client"

// Intelligent preloading strategy for maximum speed
export class PreloadingStrategy {
  private static instance: PreloadingStrategy
  private preloadedResources = new Set<string>()
  private preloadQueue: string[] = []
  private isPreloading = false

  static getInstance(): PreloadingStrategy {
    if (!PreloadingStrategy.instance) {
      PreloadingStrategy.instance = new PreloadingStrategy()
    }
    return PreloadingStrategy.instance
  }

  // Preload critical resources
  preloadCriticalResources() {
    const criticalResources = [
      '/_next/static/css/',
      '/_next/static/js/',
      '/api/health'
    ]

    criticalResources.forEach(resource => {
      this.preloadResource(resource)
    })
  }

  // Preload resource with different strategies
  preloadResource(url: string, strategy: 'preload' | 'prefetch' | 'preconnect' = 'preload') {
    if (this.preloadedResources.has(url)) return

    const link = document.createElement('link')
    link.rel = strategy
    
    if (strategy === 'preload') {
      // Determine resource type
      if (url.endsWith('.css')) {
        link.as = 'style'
      } else if (url.endsWith('.js')) {
        link.as = 'script'
      } else if (url.match(/\.(jpg|jpeg|png|gif|webp|avif)$/)) {
        link.as = 'image'
      } else if (url.match(/\.(mp4|webm|ogg)$/)) {
        link.as = 'video'
      } else if (url.match(/\.(mp3|wav|ogg)$/)) {
        link.as = 'audio'
      }
    }
    
    link.href = url
    link.crossOrigin = 'anonymous'
    
    document.head.appendChild(link)
    this.preloadedResources.add(url)
  }

  // Preload next page based on user behavior
  preloadNextPage(currentPath: string) {
    const nextPages = {
      '/': ['/create'],
      '/create': ['/create/editor'],
      '/create/editor': ['/create']
    }

    const nextPage = nextPages[currentPath as keyof typeof nextPages]
    if (nextPage) {
      nextPage.forEach(page => {
        this.preloadResource(page, 'prefetch')
      })
    }
  }

  // Preload editor components based on usage patterns
  preloadEditorComponents() {
    const editorComponents = [
      '/_next/static/chunks/editor',
      '/_next/static/chunks/timeline',
      '/_next/static/chunks/preview'
    ]

    editorComponents.forEach(component => {
      this.preloadResource(component, 'prefetch')
    })
  }

  // Intelligent preloading based on user interactions
  onUserInteraction(type: 'hover' | 'click' | 'focus', target: string) {
    switch (type) {
      case 'hover':
        // Preload on hover with delay
        setTimeout(() => {
          this.preloadResource(target, 'prefetch')
        }, 100)
        break
      case 'click':
        // Immediate preload on click
        this.preloadResource(target, 'preload')
        break
      case 'focus':
        // Preload on focus
        this.preloadResource(target, 'prefetch')
        break
    }
  }

  // Preload media files
  preloadMedia(url: string, type: 'image' | 'video' | 'audio') {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = type
    link.href = url
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  }

  // DNS prefetch for external domains
  prefetchDNS(domain: string) {
    const link = document.createElement('link')
    link.rel = 'dns-prefetch'
    link.href = `//${domain}`
    document.head.appendChild(link)
  }

  // Preconnect to external resources
  preconnect(url: string) {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = url
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  }

  // Batch preload resources
  batchPreload(urls: string[], delay: number = 0) {
    if (delay > 0) {
      setTimeout(() => this.batchPreload(urls, 0), delay)
      return
    }

    urls.forEach((url, index) => {
      setTimeout(() => {
        this.preloadResource(url, 'prefetch')
      }, index * 50) // Stagger requests
    })
  }

  // Preload based on viewport
  preloadInViewport() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement
          const preloadUrl = target.dataset.preload
          if (preloadUrl) {
            this.preloadResource(preloadUrl, 'preload')
            observer.unobserve(target)
          }
        }
      })
    }, { rootMargin: '50px' })

    // Observe elements with data-preload attribute
    document.querySelectorAll('[data-preload]').forEach(el => {
      observer.observe(el)
    })
  }

  // Initialize preloading strategy
  initialize() {
    // Preload critical resources immediately
    this.preloadCriticalResources()
    
    // Preload based on current page
    this.preloadNextPage(window.location.pathname)
    
    // Preload editor components if on editor page
    if (window.location.pathname.includes('/editor')) {
      this.preloadEditorComponents()
    }
    
    // Set up viewport-based preloading
    this.preloadInViewport()
    
    // Prefetch DNS for common domains
    this.prefetchDNS('fonts.googleapis.com')
    this.prefetchDNS('fonts.gstatic.com')
    
    console.log('Preloading strategy initialized')
  }
}

// Resource hints for external services
export function addResourceHints() {
  const hints = [
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' }
  ]

  hints.forEach(hint => {
    const link = document.createElement('link')
    Object.assign(link, hint)
    document.head.appendChild(link)
  })
}

// Critical CSS inlining
export function inlineCriticalCSS() {
  const criticalCSS = `
    /* Critical CSS for above-the-fold content */
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
    .bg-black { background-color: #000; }
    .text-white { color: #fff; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .h-screen { height: 100vh; }
    .w-screen { width: 100vw; }
  `

  const style = document.createElement('style')
  style.textContent = criticalCSS
  document.head.insertBefore(style, document.head.firstChild)
}

// Initialize preloading on page load
export function initializePreloading() {
  if (typeof window !== 'undefined') {
    const strategy = PreloadingStrategy.getInstance()
    strategy.initialize()
    addResourceHints()
    inlineCriticalCSS()
  }
}
