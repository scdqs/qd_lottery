/**
 * ShakeSensor类
 * 封装设备加速度传感器的访问，实现摇动检测和计数
 * 
 * 需求: 5.2, 5.3, 5.6
 */

/**
 * 摇动传感器配置
 */
interface ShakeSensorConfig {
  threshold?: number;        // 加速度阈值，默认15
  debounceTime?: number;     // 防抖时间（毫秒），默认100ms
}

/**
 * 加速度数据
 */
interface AccelerationData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

/**
 * ShakeSensor类
 * 监听设备加速度传感器，检测摇动动作并计数
 */
export class ShakeSensor {
  private config: ShakeSensorConfig;
  private isListening = false;
  private shakeCount = 0;
  private lastShakeTime = 0;
  private lastAcceleration: AccelerationData | null = null;
  private callback: ((count: number) => void) | null = null;

  // 默认配置
  private static readonly DEFAULT_THRESHOLD = 15;
  private static readonly DEFAULT_DEBOUNCE_TIME = 100;

  constructor(config: ShakeSensorConfig = {}) {
    this.config = {
      threshold: config.threshold || ShakeSensor.DEFAULT_THRESHOLD,
      debounceTime: config.debounceTime || ShakeSensor.DEFAULT_DEBOUNCE_TIME,
    };
  }

  /**
   * 检测设备是否支持加速度传感器
   * 需求: 5.6
   */
  isSupported(): boolean {
    return typeof DeviceMotionEvent !== 'undefined' && 
           typeof window !== 'undefined' &&
           'addEventListener' in window;
  }

  /**
   * 请求传感器权限（iOS 13+需要）
   */
  async requestPermission(): Promise<boolean> {
    // 检查是否需要请求权限（iOS 13+）
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.error('Failed to request device motion permission:', error);
        return false;
      }
    }
    
    // 其他设备不需要请求权限
    return true;
  }

  /**
   * 开始监听加速度传感器
   * 需求: 5.2
   * 
   * @param callback 摇动检测回调函数，参数为当前摇动次数
   */
  async start(callback: (count: number) => void): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Device does not support motion sensors');
    }

    if (this.isListening) {
      console.warn('ShakeSensor is already listening');
      return;
    }

    // 请求权限
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      throw new Error('Motion sensor permission denied');
    }

    this.callback = callback;
    this.isListening = true;
    this.shakeCount = 0;
    this.lastShakeTime = 0;
    this.lastAcceleration = null;

    // 监听devicemotion事件
    window.addEventListener('devicemotion', this.handleDeviceMotion);
  }

  /**
   * 停止监听加速度传感器
   * 需求: 5.5
   */
  stop(): void {
    if (!this.isListening) {
      return;
    }

    this.isListening = false;
    window.removeEventListener('devicemotion', this.handleDeviceMotion);
    this.callback = null;
  }

  /**
   * 获取当前摇动次数
   */
  getShakeCount(): number {
    return this.shakeCount;
  }

  /**
   * 重置摇动次数
   */
  reset(): void {
    this.shakeCount = 0;
    this.lastShakeTime = 0;
    this.lastAcceleration = null;
  }

  /**
   * 处理设备运动事件
   * 需求: 5.3 - 计算摇动速度和累计次数
   */
  private handleDeviceMotion = (event: DeviceMotionEvent): void => {
    if (!this.isListening || !event.accelerationIncludingGravity) {
      return;
    }

    const { x, y, z } = event.accelerationIncludingGravity;

    // 如果加速度数据无效，跳过
    if (x === null || y === null || z === null) {
      return;
    }

    const currentTime = Date.now();
    const currentAcceleration: AccelerationData = {
      x,
      y,
      z,
      timestamp: currentTime,
    };

    // 如果有上一次的加速度数据，计算变化量
    if (this.lastAcceleration) {
      const deltaX = Math.abs(currentAcceleration.x - this.lastAcceleration.x);
      const deltaY = Math.abs(currentAcceleration.y - this.lastAcceleration.y);
      const deltaZ = Math.abs(currentAcceleration.z - this.lastAcceleration.z);

      // 计算加速度变化的总量（向量长度）
      const acceleration = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

      // 检测是否超过阈值且满足防抖时间
      if (
        acceleration > (this.config.threshold || ShakeSensor.DEFAULT_THRESHOLD) &&
        currentTime - this.lastShakeTime > (this.config.debounceTime || ShakeSensor.DEFAULT_DEBOUNCE_TIME)
      ) {
        this.shakeCount++;
        this.lastShakeTime = currentTime;

        // 触发回调
        if (this.callback) {
          this.callback(this.shakeCount);
        }
      }
    }

    // 更新上一次的加速度数据
    this.lastAcceleration = currentAcceleration;
  };

  /**
   * 检查是否正在监听
   */
  isActive(): boolean {
    return this.isListening;
  }
}

/**
 * 创建ShakeSensor实例的工厂函数
 */
export const createShakeSensor = (config?: ShakeSensorConfig): ShakeSensor => {
  return new ShakeSensor(config);
};
