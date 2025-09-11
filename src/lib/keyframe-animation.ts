"use client"

export interface Keyframe {
  id: string
  time: number
  properties: Record<string, number>
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic'
}

export interface AnimatedProperty {
  id: string
  name: string
  keyframes: Keyframe[]
  currentValue: number
}

export interface AnimationResult {
  success: boolean
  animatedValue?: number
  error?: string
}

class KeyframeAnimationService {
  private animations: Map<string, AnimatedProperty> = new Map()

  createAnimation(propertyId: string, name: string): AnimatedProperty {
    const animation: AnimatedProperty = {
      id: propertyId,
      name,
      keyframes: [],
      currentValue: 0
    }
    
    this.animations.set(propertyId, animation)
    return animation
  }

  addKeyframe(
    propertyId: string,
    time: number,
    value: number,
    easing: Keyframe['easing'] = 'linear'
  ): void {
    const animation = this.animations.get(propertyId)
    if (!animation) return

    const keyframe: Keyframe = {
      id: `keyframe_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      time,
      properties: { value },
      easing
    }

    animation.keyframes.push(keyframe)
    animation.keyframes.sort((a, b) => a.time - b.time)
  }

  removeKeyframe(propertyId: string, keyframeId: string): void {
    const animation = this.animations.get(propertyId)
    if (!animation) return

    animation.keyframes = animation.keyframes.filter(kf => kf.id !== keyframeId)
  }

  updateKeyframe(
    propertyId: string,
    keyframeId: string,
    updates: Partial<Keyframe>
  ): void {
    const animation = this.animations.get(propertyId)
    if (!animation) return

    const keyframeIndex = animation.keyframes.findIndex(kf => kf.id === keyframeId)
    if (keyframeIndex === -1) return

    animation.keyframes[keyframeIndex] = {
      ...animation.keyframes[keyframeIndex],
      ...updates
    }

    // Re-sort if time changed
    if (updates.time !== undefined) {
      animation.keyframes.sort((a, b) => a.time - b.time)
    }
  }

  getValueAtTime(propertyId: string, time: number): number {
    const animation = this.animations.get(propertyId)
    if (!animation || animation.keyframes.length === 0) return 0

    // Find surrounding keyframes
    const keyframes = animation.keyframes
    let beforeKeyframe: Keyframe | null = null
    let afterKeyframe: Keyframe | null = null

    for (let i = 0; i < keyframes.length; i++) {
      if (keyframes[i].time <= time) {
        beforeKeyframe = keyframes[i]
      }
      if (keyframes[i].time >= time && !afterKeyframe) {
        afterKeyframe = keyframes[i]
        break
      }
    }

    // No keyframes
    if (!beforeKeyframe && !afterKeyframe) return 0

    // Before first keyframe
    if (!beforeKeyframe && afterKeyframe) {
      return afterKeyframe.properties.value
    }

    // After last keyframe
    if (beforeKeyframe && !afterKeyframe) {
      return beforeKeyframe.properties.value
    }

    // Between keyframes - interpolate
    if (beforeKeyframe && afterKeyframe) {
      return this.interpolate(
        beforeKeyframe.properties.value,
        afterKeyframe.properties.value,
        beforeKeyframe.time,
        afterKeyframe.time,
        time,
        beforeKeyframe.easing
      )
    }

    return 0
  }

  private interpolate(
    startValue: number,
    endValue: number,
    startTime: number,
    endTime: number,
    currentTime: number,
    easing: Keyframe['easing']
  ): number {
    if (startTime === endTime) return startValue

    const progress = (currentTime - startTime) / (endTime - startTime)
    const easedProgress = this.applyEasing(progress, easing)
    
    return startValue + (endValue - startValue) * easedProgress
  }

  private applyEasing(progress: number, easing: Keyframe['easing']): number {
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

  getAllAnimations(): AnimatedProperty[] {
    return Array.from(this.animations.values())
  }

  getAnimation(propertyId: string): AnimatedProperty | undefined {
    return this.animations.get(propertyId)
  }

  deleteAnimation(propertyId: string): void {
    this.animations.delete(propertyId)
  }

  clearAllAnimations(): void {
    this.animations.clear()
  }

  // Utility methods for common animations
  createFadeIn(propertyId: string, duration: number): void {
    this.createAnimation(propertyId, 'Fade In')
    this.addKeyframe(propertyId, 0, 0, 'ease-in')
    this.addKeyframe(propertyId, duration, 100, 'ease-out')
  }

  createFadeOut(propertyId: string, startTime: number, duration: number): void {
    this.createAnimation(propertyId, 'Fade Out')
    this.addKeyframe(propertyId, startTime, 100, 'ease-in')
    this.addKeyframe(propertyId, startTime + duration, 0, 'ease-out')
  }

  createScaleIn(propertyId: string, duration: number): void {
    this.createAnimation(propertyId, 'Scale In')
    this.addKeyframe(propertyId, 0, 0, 'bounce')
    this.addKeyframe(propertyId, duration, 100, 'ease-out')
  }

  createSlideIn(propertyId: string, duration: number, direction: 'left' | 'right' | 'up' | 'down'): void {
    this.createAnimation(propertyId, `Slide In ${direction}`)
    
    let startValue = 0
    switch (direction) {
      case 'left':
        startValue = -100
        break
      case 'right':
        startValue = 100
        break
      case 'up':
        startValue = -100
        break
      case 'down':
        startValue = 100
        break
    }
    
    this.addKeyframe(propertyId, 0, startValue, 'ease-out')
    this.addKeyframe(propertyId, duration, 0, 'ease-out')
  }

  createRotation(propertyId: string, startTime: number, duration: number, degrees: number): void {
    this.createAnimation(propertyId, 'Rotation')
    this.addKeyframe(propertyId, startTime, 0, 'linear')
    this.addKeyframe(propertyId, startTime + duration, degrees, 'linear')
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
let keyframeAnimationService: KeyframeAnimationService | null = null

export function getKeyframeAnimationService(): KeyframeAnimationService {
  if (!keyframeAnimationService) {
    keyframeAnimationService = new KeyframeAnimationService()
  }
  return keyframeAnimationService
}

// Utility functions
export function createKeyframeAnimation(
  propertyId: string,
  name: string
): AnimatedProperty {
  const service = getKeyframeAnimationService()
  return service.createAnimation(propertyId, name)
}

export function addKeyframeToAnimation(
  propertyId: string,
  time: number,
  value: number,
  easing?: Keyframe['easing']
): void {
  const service = getKeyframeAnimationService()
  service.addKeyframe(propertyId, time, value, easing)
}

export function getAnimatedValue(
  propertyId: string,
  time: number
): number {
  const service = getKeyframeAnimationService()
  return service.getValueAtTime(propertyId, time)
}
