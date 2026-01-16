import { ShakeSensor, createShakeSensor } from './ShakeSensor';

describe('ShakeSensor', () => {
  let sensor: ShakeSensor;
  let mockCallback: jest.Mock;

  beforeEach(() => {
    sensor = new ShakeSensor();
    mockCallback = jest.fn();
    
    // Mock DeviceMotionEvent
    global.DeviceMotionEvent = jest.fn() as any;
  });

  afterEach(() => {
    sensor.stop();
    jest.clearAllMocks();
  });

  describe('isSupported', () => {
    it('should return true when DeviceMotionEvent is supported', () => {
      expect(sensor.isSupported()).toBe(true);
    });

    it('should return false when DeviceMotionEvent is not supported', () => {
      const originalDeviceMotionEvent = global.DeviceMotionEvent;
      (global as any).DeviceMotionEvent = undefined;
      
      const newSensor = new ShakeSensor();
      expect(newSensor.isSupported()).toBe(false);
      
      global.DeviceMotionEvent = originalDeviceMotionEvent;
    });
  });

  describe('start and stop', () => {
    it('should start listening to device motion events', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      sensor.start(mockCallback);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('devicemotion', expect.any(Function));
      expect(sensor.isActive()).toBe(true);
    });

    it('should stop listening to device motion events', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      sensor.start(mockCallback);
      sensor.stop();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('devicemotion', expect.any(Function));
      expect(sensor.isActive()).toBe(false);
    });

    it('should throw error when device does not support motion sensors', () => {
      const originalDeviceMotionEvent = global.DeviceMotionEvent;
      (global as any).DeviceMotionEvent = undefined;
      
      const newSensor = new ShakeSensor();
      expect(() => newSensor.start(mockCallback)).toThrow('Device does not support motion sensors');
      
      global.DeviceMotionEvent = originalDeviceMotionEvent;
    });

    it('should not start if already listening', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      sensor.start(mockCallback);
      sensor.start(mockCallback);
      
      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith('ShakeSensor is already listening');
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('shake detection', () => {
    it('should detect shake when acceleration exceeds threshold', () => {
      sensor.start(mockCallback);

      // Simulate first motion event (baseline)
      const event1 = new Event('devicemotion') as DeviceMotionEvent;
      Object.defineProperty(event1, 'accelerationIncludingGravity', {
        value: { x: 0, y: 0, z: 9.8 },
        writable: false,
      });
      window.dispatchEvent(event1);

      // Simulate second motion event with significant acceleration
      const event2 = new Event('devicemotion') as DeviceMotionEvent;
      Object.defineProperty(event2, 'accelerationIncludingGravity', {
        value: { x: 20, y: 20, z: 20 },
        writable: false,
      });
      window.dispatchEvent(event2);

      expect(mockCallback).toHaveBeenCalledWith(1);
      expect(sensor.getShakeCount()).toBe(1);
    });

    it('should not detect shake when acceleration is below threshold', () => {
      sensor.start(mockCallback);

      // Simulate first motion event
      const event1 = new Event('devicemotion') as DeviceMotionEvent;
      Object.defineProperty(event1, 'accelerationIncludingGravity', {
        value: { x: 0, y: 0, z: 9.8 },
        writable: false,
      });
      window.dispatchEvent(event1);

      // Simulate second motion event with small acceleration
      const event2 = new Event('devicemotion') as DeviceMotionEvent;
      Object.defineProperty(event2, 'accelerationIncludingGravity', {
        value: { x: 1, y: 1, z: 10 },
        writable: false,
      });
      window.dispatchEvent(event2);

      expect(mockCallback).not.toHaveBeenCalled();
      expect(sensor.getShakeCount()).toBe(0);
    });

    it('should ignore events with null acceleration values', () => {
      sensor.start(mockCallback);

      const event = new Event('devicemotion') as DeviceMotionEvent;
      Object.defineProperty(event, 'accelerationIncludingGravity', {
        value: { x: null, y: null, z: null },
        writable: false,
      });
      window.dispatchEvent(event);

      expect(mockCallback).not.toHaveBeenCalled();
      expect(sensor.getShakeCount()).toBe(0);
    });

    it('should respect debounce time between shakes', (done) => {
      const debounceTime = 100;
      const sensorWithDebounce = new ShakeSensor({ debounceTime });
      sensorWithDebounce.start(mockCallback);

      // First shake
      const event1 = new Event('devicemotion') as DeviceMotionEvent;
      Object.defineProperty(event1, 'accelerationIncludingGravity', {
        value: { x: 0, y: 0, z: 9.8 },
        writable: false,
      });
      window.dispatchEvent(event1);

      const event2 = new Event('devicemotion') as DeviceMotionEvent;
      Object.defineProperty(event2, 'accelerationIncludingGravity', {
        value: { x: 20, y: 20, z: 20 },
        writable: false,
      });
      window.dispatchEvent(event2);

      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Try to shake again immediately (should be ignored)
      const event3 = new Event('devicemotion') as DeviceMotionEvent;
      Object.defineProperty(event3, 'accelerationIncludingGravity', {
        value: { x: 0, y: 0, z: 9.8 },
        writable: false,
      });
      window.dispatchEvent(event3);

      const event4 = new Event('devicemotion') as DeviceMotionEvent;
      Object.defineProperty(event4, 'accelerationIncludingGravity', {
        value: { x: 20, y: 20, z: 20 },
        writable: false,
      });
      window.dispatchEvent(event4);

      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Wait for debounce time and shake again
      setTimeout(() => {
        const event5 = new Event('devicemotion') as DeviceMotionEvent;
        Object.defineProperty(event5, 'accelerationIncludingGravity', {
          value: { x: 0, y: 0, z: 9.8 },
          writable: false,
        });
        window.dispatchEvent(event5);

        const event6 = new Event('devicemotion') as DeviceMotionEvent;
        Object.defineProperty(event6, 'accelerationIncludingGravity', {
          value: { x: 20, y: 20, z: 20 },
          writable: false,
        });
        window.dispatchEvent(event6);

        expect(mockCallback).toHaveBeenCalledTimes(2);
        sensorWithDebounce.stop();
        done();
      }, debounceTime + 10);
    });

    it('should use custom threshold', () => {
      const customThreshold = 30;
      const sensorWithThreshold = new ShakeSensor({ threshold: customThreshold });
      sensorWithThreshold.start(mockCallback);

      // First event
      const event1 = new Event('devicemotion') as DeviceMotionEvent;
      Object.defineProperty(event1, 'accelerationIncludingGravity', {
        value: { x: 0, y: 0, z: 9.8 },
        writable: false,
      });
      window.dispatchEvent(event1);

      // Second event with acceleration below custom threshold
      // Delta: x=5, y=5, z=5, magnitude = sqrt(75) ≈ 8.66 < 30
      const event2 = new Event('devicemotion') as DeviceMotionEvent;
      Object.defineProperty(event2, 'accelerationIncludingGravity', {
        value: { x: 5, y: 5, z: 14.8 },
        writable: false,
      });
      window.dispatchEvent(event2);

      expect(mockCallback).not.toHaveBeenCalled();
      expect(sensorWithThreshold.getShakeCount()).toBe(0);

      sensorWithThreshold.stop();
    });
  });

  describe('reset', () => {
    it('should reset shake count to zero', () => {
      sensor.start(mockCallback);

      // Simulate shake
      const event1 = new Event('devicemotion') as DeviceMotionEvent;
      Object.defineProperty(event1, 'accelerationIncludingGravity', {
        value: { x: 0, y: 0, z: 9.8 },
        writable: false,
      });
      window.dispatchEvent(event1);

      const event2 = new Event('devicemotion') as DeviceMotionEvent;
      Object.defineProperty(event2, 'accelerationIncludingGravity', {
        value: { x: 20, y: 20, z: 20 },
        writable: false,
      });
      window.dispatchEvent(event2);

      expect(sensor.getShakeCount()).toBe(1);

      sensor.reset();
      expect(sensor.getShakeCount()).toBe(0);
    });
  });

  describe('createShakeSensor factory', () => {
    it('should create a new ShakeSensor instance', () => {
      const newSensor = createShakeSensor();
      expect(newSensor).toBeInstanceOf(ShakeSensor);
      expect(newSensor.isSupported()).toBe(true);
    });

    it('should create sensor with custom config', () => {
      const config = { threshold: 20, debounceTime: 200 };
      const newSensor = createShakeSensor(config);
      expect(newSensor).toBeInstanceOf(ShakeSensor);
    });
  });
});
