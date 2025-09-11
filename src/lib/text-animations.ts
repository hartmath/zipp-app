"use client"

export interface TextAnimation {
  id: string
  name: string
  type: 'fade' | 'slide' | 'scale' | 'rotate' | 'typewriter' | 'bounce' | 'shake' | 'glow'
  duration: number
  delay: number
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic'
  properties: {
    from: Record<string, any>
    to: Record<string, any>
  }
}

export interface TextAnimationPreset {
  name: string
  description: string
  animation: Omit<TextAnimation, 'id'>
}

class TextAnimationService {
  private animations: Map<string, TextAnimation> = new Map()

  getAnimationPresets(): TextAnimationPreset[] {
    return [
      {
        name: 'Fade In',
        description: 'Text fades in from transparent',
        animation: {
          name: 'Fade In',
          type: 'fade',
          duration: 1,
          delay: 0,
          easing: 'ease-in',
          properties: {
            from: { opacity: 0 },
            to: { opacity: 1 }
          }
        }
      },
      {
        name: 'Fade Out',
        description: 'Text fades out to transparent',
        animation: {
          name: 'Fade Out',
          type: 'fade',
          duration: 1,
          delay: 0,
          easing: 'ease-out',
          properties: {
            from: { opacity: 1 },
            to: { opacity: 0 }
          }
        }
      },
      {
        name: 'Slide In Left',
        description: 'Text slides in from the left',
        animation: {
          name: 'Slide In Left',
          type: 'slide',
          duration: 1,
          delay: 0,
          easing: 'ease-out',
          properties: {
            from: { x: -100, opacity: 0 },
            to: { x: 0, opacity: 1 }
          }
        }
      },
      {
        name: 'Slide In Right',
        description: 'Text slides in from the right',
        animation: {
          name: 'Slide In Right',
          type: 'slide',
          duration: 1,
          delay: 0,
          easing: 'ease-out',
          properties: {
            from: { x: 100, opacity: 0 },
            to: { x: 0, opacity: 1 }
          }
        }
      },
      {
        name: 'Slide In Up',
        description: 'Text slides in from below',
        animation: {
          name: 'Slide In Up',
          type: 'slide',
          duration: 1,
          delay: 0,
          easing: 'ease-out',
          properties: {
            from: { y: 100, opacity: 0 },
            to: { y: 0, opacity: 1 }
          }
        }
      },
      {
        name: 'Slide In Down',
        description: 'Text slides in from above',
        animation: {
          name: 'Slide In Down',
          type: 'slide',
          duration: 1,
          delay: 0,
          easing: 'ease-out',
          properties: {
            from: { y: -100, opacity: 0 },
            to: { y: 0, opacity: 1 }
          }
        }
      },
      {
        name: 'Scale In',
        description: 'Text scales in from small to normal',
        animation: {
          name: 'Scale In',
          type: 'scale',
          duration: 1,
          delay: 0,
          easing: 'bounce',
          properties: {
            from: { scale: 0, opacity: 0 },
            to: { scale: 1, opacity: 1 }
          }
        }
      },
      {
        name: 'Scale Out',
        description: 'Text scales out from normal to small',
        animation: {
          name: 'Scale Out',
          type: 'scale',
          duration: 1,
          delay: 0,
          easing: 'ease-in',
          properties: {
            from: { scale: 1, opacity: 1 },
            to: { scale: 0, opacity: 0 }
          }
        }
      },
      {
        name: 'Rotate In',
        description: 'Text rotates in with a spin',
        animation: {
          name: 'Rotate In',
          type: 'rotate',
          duration: 1,
          delay: 0,
          easing: 'ease-out',
          properties: {
            from: { rotation: -180, opacity: 0 },
            to: { rotation: 0, opacity: 1 }
          }
        }
      },
      {
        name: 'Typewriter',
        description: 'Text appears character by character',
        animation: {
          name: 'Typewriter',
          type: 'typewriter',
          duration: 2,
          delay: 0,
          easing: 'linear',
          properties: {
            from: { charactersVisible: 0 },
            to: { charactersVisible: 100 }
          }
        }
      },
      {
        name: 'Bounce',
        description: 'Text bounces in place',
        animation: {
          name: 'Bounce',
          type: 'bounce',
          duration: 1,
          delay: 0,
          easing: 'bounce',
          properties: {
            from: { y: -50 },
            to: { y: 0 }
          }
        }
      },
      {
        name: 'Shake',
        description: 'Text shakes horizontally',
        animation: {
          name: 'Shake',
          type: 'shake',
          duration: 0.5,
          delay: 0,
          easing: 'linear',
          properties: {
            from: { x: 0 },
            to: { x: 10 }
          }
        }
      },
      {
        name: 'Glow',
        description: 'Text glows with a pulsing effect',
        animation: {
          name: 'Glow',
          type: 'glow',
          duration: 2,
          delay: 0,
          easing: 'ease-in-out',
          properties: {
            from: { textShadow: '0 0 5px rgba(255,255,255,0.5)' },
            to: { textShadow: '0 0 20px rgba(255,255,255,1)' }
          }
        }
      }
    ]
  }

  createAnimation(preset: TextAnimationPreset): TextAnimation {
    const animation: TextAnimation = {
      id: `text_anim_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      ...preset.animation
    }
    
    this.animations.set(animation.id, animation)
    return animation
  }

  getAnimation(id: string): TextAnimation | undefined {
    return this.animations.get(id)
  }

  getAllAnimations(): TextAnimation[] {
    return Array.from(this.animations.values())
  }

  deleteAnimation(id: string): void {
    this.animations.delete(id)
  }

  // Apply animation to text element
  applyAnimationToElement(
    element: HTMLElement,
    animation: TextAnimation,
    currentTime: number,
    startTime: number
  ): void {
    const elapsed = currentTime - startTime
    const progress = Math.min(Math.max(elapsed / animation.duration, 0), 1)
    
    if (progress < 0 || progress > 1) return

    const easedProgress = this.applyEasing(progress, animation.easing)
    
    // Apply animation based on type
    switch (animation.type) {
      case 'fade':
        this.applyFadeAnimation(element, animation, easedProgress)
        break
      case 'slide':
        this.applySlideAnimation(element, animation, easedProgress)
        break
      case 'scale':
        this.applyScaleAnimation(element, animation, easedProgress)
        break
      case 'rotate':
        this.applyRotateAnimation(element, animation, easedProgress)
        break
      case 'typewriter':
        this.applyTypewriterAnimation(element, animation, easedProgress)
        break
      case 'bounce':
        this.applyBounceAnimation(element, animation, easedProgress)
        break
      case 'shake':
        this.applyShakeAnimation(element, animation, easedProgress)
        break
      case 'glow':
        this.applyGlowAnimation(element, animation, easedProgress)
        break
    }
  }

  private applyEasing(progress: number, easing: TextAnimation['easing']): number {
    switch (easing) {
      case 'linear':
        return progress
      case 'ease-in':
        return progress * progress
      case 'ease-out':
        return 1 - Math.pow(1 - progress, 2)
      case 'ease-in-out':
        return progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2
      case 'bounce':
        return this.bounceEasing(progress)
      case 'elastic':
        return this.elasticEasing(progress)
      default:
        return progress
    }
  }

  private bounceEasing(progress: number): number {
    const n1 = 7.5625
    const d1 = 2.75

    if (progress < 1 / d1) {
      return n1 * progress * progress
    } else if (progress < 2 / d1) {
      return n1 * (progress -= 1.5 / d1) * progress + 0.75
    } else if (progress < 2.5 / d1) {
      return n1 * (progress -= 2.25 / d1) * progress + 0.9375
    } else {
      return n1 * (progress -= 2.625 / d1) * progress + 0.984375
    }
  }

  private elasticEasing(progress: number): number {
    const c4 = (2 * Math.PI) / 3

    if (progress === 0) return 0
    if (progress === 1) return 1

    return Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * c4) + 1
  }

  private applyFadeAnimation(element: HTMLElement, animation: TextAnimation, progress: number): void {
    const fromOpacity = animation.properties.from.opacity || 1
    const toOpacity = animation.properties.to.opacity || 0
    const opacity = fromOpacity + (toOpacity - fromOpacity) * progress
    
    element.style.opacity = opacity.toString()
  }

  private applySlideAnimation(element: HTMLElement, animation: TextAnimation, progress: number): void {
    const fromX = animation.properties.from.x || 0
    const toX = animation.properties.to.x || 0
    const fromY = animation.properties.from.y || 0
    const toY = animation.properties.to.y || 0
    const fromOpacity = animation.properties.from.opacity || 1
    const toOpacity = animation.properties.to.opacity || 1
    
    const x = fromX + (toX - fromX) * progress
    const y = fromY + (toY - fromY) * progress
    const opacity = fromOpacity + (toOpacity - fromOpacity) * progress
    
    element.style.transform = `translate(${x}px, ${y}px)`
    element.style.opacity = opacity.toString()
  }

  private applyScaleAnimation(element: HTMLElement, animation: TextAnimation, progress: number): void {
    const fromScale = animation.properties.from.scale || 1
    const toScale = animation.properties.to.scale || 1
    const fromOpacity = animation.properties.from.opacity || 1
    const toOpacity = animation.properties.to.opacity || 1
    
    const scale = fromScale + (toScale - fromScale) * progress
    const opacity = fromOpacity + (toOpacity - fromOpacity) * progress
    
    element.style.transform = `scale(${scale})`
    element.style.opacity = opacity.toString()
  }

  private applyRotateAnimation(element: HTMLElement, animation: TextAnimation, progress: number): void {
    const fromRotation = animation.properties.from.rotation || 0
    const toRotation = animation.properties.to.rotation || 0
    const fromOpacity = animation.properties.from.opacity || 1
    const toOpacity = animation.properties.to.opacity || 1
    
    const rotation = fromRotation + (toRotation - fromRotation) * progress
    const opacity = fromOpacity + (toOpacity - fromOpacity) * progress
    
    element.style.transform = `rotate(${rotation}deg)`
    element.style.opacity = opacity.toString()
  }

  private applyTypewriterAnimation(element: HTMLElement, animation: TextAnimation, progress: number): void {
    const text = element.textContent || ''
    const charactersVisible = Math.floor(text.length * progress)
    const visibleText = text.substring(0, charactersVisible)
    
    element.textContent = visibleText
  }

  private applyBounceAnimation(element: HTMLElement, animation: TextAnimation, progress: number): void {
    const fromY = animation.properties.from.y || 0
    const toY = animation.properties.to.y || 0
    const y = fromY + (toY - fromY) * progress
    
    element.style.transform = `translateY(${y}px)`
  }

  private applyShakeAnimation(element: HTMLElement, animation: TextAnimation, progress: number): void {
    const shakeIntensity = 10
    const shakeSpeed = 20
    const x = Math.sin(progress * Math.PI * shakeSpeed) * shakeIntensity
    
    element.style.transform = `translateX(${x}px)`
  }

  private applyGlowAnimation(element: HTMLElement, animation: TextAnimation, progress: number): void {
    const fromGlow = animation.properties.from.textShadow || '0 0 5px rgba(255,255,255,0.5)'
    const toGlow = animation.properties.to.textShadow || '0 0 20px rgba(255,255,255,1)'
    
    // Simple glow effect - in a real implementation, you'd parse the shadow values
    const intensity = 5 + (15 * progress)
    element.style.textShadow = `0 0 ${intensity}px rgba(255,255,255,${0.5 + 0.5 * progress})`
  }

  // Export/Import functionality
  exportAnimations(): string {
    const data = {
      animations: Array.from(this.animations.entries()),
      version: '1.0',
      exportedAt: new Date().toISOString()
    }
    return JSON.stringify(data, null, 2)
  }

  importAnimations(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      if (!data.animations || !Array.isArray(data.animations)) {
        return false
      }

      this.animations.clear()
      for (const [id, animation] of data.animations) {
        this.animations.set(id, animation)
      }
      return true
    } catch (error) {
      console.error('Failed to import animations:', error)
      return false
    }
  }
}

// Singleton instance
let textAnimationService: TextAnimationService | null = null

export function getTextAnimationService(): TextAnimationService {
  if (!textAnimationService) {
    textAnimationService = new TextAnimationService()
  }
  return textAnimationService
}

// Utility functions
export function getTextAnimationPresets(): TextAnimationPreset[] {
  const service = getTextAnimationService()
  return service.getAnimationPresets()
}

export function createTextAnimation(preset: TextAnimationPreset): TextAnimation {
  const service = getTextAnimationService()
  return service.createAnimation(preset)
}
