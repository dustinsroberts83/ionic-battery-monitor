'use client'

import React, { useState, useEffect } from 'react';
import { Bluetooth, Battery, Signal, Zap, AlertCircle, Loader2, Smartphone, MapPin, Clock, RotateCw, Info } from 'lucide-react';

const IonicBatteryApp = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [batteryData, setBatteryData] = useState({
    voltage: 0,
    current: 0,
    soc: 0,
    temperature: 0,
    cycles: 0,
    power: 0,
    status: 'Standby',
    timeToDischarge: '--:--',
    timeToCharge: '--:--'
  });
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [server, setServer] = useState<BluetoothRemoteGATTServer | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [eventLog, setEventLog] = useState<Array<{time: string, message: string}>>([]);
  const [showPermissionNote, setShowPermissionNote] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Known UUIDs for battery services (standard and custom)
  const BATTERY_SERVICE_UUID = 0x180F; // Standard Battery Service
  const BATTERY_LEVEL_UUID = 0x2A19; // Standard Battery Level Characteristic
  
  // Possible custom UUIDs (these are guesses - you'll need to discover the real ones)
  const POSSIBLE_SERVICE_UUIDS = [
    '0000180f-0000-1000-8000-00805f9b34fb', // Standard Battery Service
    '0000ff00-0000-1000-8000-00805f9b34fb', // Common custom service
    '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service (common for custom implementations)
  ];

  // Add debug logging
  const addDebug = (message: string) => {
    console.log(message);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`].slice(-10));
  };

  // Check if Web Bluetooth is supported
  const checkBluetoothSupport = () => {
    if (!navigator.bluetooth) {
      // Detect browser type
      const userAgent = navigator.userAgent.toLowerCase();
      const isBluefy = userAgent.includes('bluefy');
      
      if (isBluefy) {
        setError('Bluetooth API not accessible. Please ensure Bluefy has Bluetooth permissions in iOS Settings.');
      } else if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
        setError('Safari doesn\'t support Web Bluetooth. Please use Bluefy Browser from the App Store.');
      } else {
        setError('Web Bluetooth is not supported in this browser. Try Chrome, Edge, or Bluefy.');
      }
      return false;
    }
    return true;
  };

  // Scan for Bluetooth devices
  const startScanning = async () => {
    if (!checkBluetoothSupport()) return;

    setIsScanning(true);
    setError('');
    setShowPermissionNote(false);
    setDebugInfo([]);
    
    try {
      addDebug('Starting Bluetooth scan...');
      
      // Request device with multiple filters
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'IC-' }, // Ionic batteries often start with IC-
          { namePrefix: 'Ionic' },
          { name: 'IC-24V50-EP' },
        ],
        optionalServices: [...POSSIBLE_SERVICE_UUIDS, BATTERY_SERVICE_UUID as any]
      });
      
      addDebug(`Found device: ${device.name}`);
      setDevice(device);
      
      // Set up disconnect listener
      device.addEventListener('gattserverdisconnected', onDisconnected);
      
      // Auto-connect to the found device
      await connectToDevice(device);
      
    } catch (err: any) {
      console.error('Full error object:', err);
      addDebug(`Scan error: ${err?.message || err?.name || JSON.stringify(err)}`);
      
      if (err.name === 'NotFoundError') {
        setError('No Ionic battery found. Make sure your battery is powered on and within range.');
      } else if (err.name === 'SecurityError') {
        setError('Bluetooth permission denied. Please allow Bluetooth access and try again.');
      } else if (err.name === 'NotAllowedError') {
        setError('Bluetooth access not allowed. Make sure you granted permission to Bluefy.');
      } else {
        setError(`Scanning failed: ${err?.message || err?.name || 'Unknown error'}`);
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Connect to the device
  const connectToDevice = async (device: BluetoothDevice) => {
    try {
      addDebug('Connecting to GATT server...');
      const server = await device.gatt!.connect();
      setServer(server);
      addDebug('Connected to GATT server');
      
      // Discover services
      addDebug('Discovering services...');
      const services = await server.getPrimaryServices();
      addDebug(`Found ${services.length} services`);
      
      // Log all services for debugging
      for (const service of services) {
        addDebug(`Service: ${service.uuid}`);
        
        try {
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            addDebug(`  - Characteristic: ${char.uuid}`);
            
            // Try to read the characteristic
            if (char.properties.read) {
              try {
                const value = await char.readValue();
                const data = new Uint8Array(value.buffer);
                addDebug(`    Value: ${Array.from(data).join(', ')}`);
                
                // Try to parse battery data
                await parseBatteryData(char, value);
              } catch (e) {
                addDebug(`    Could not read: ${e}`);
              }
            }
            
            // Set up notifications if available
            if (char.properties.notify) {
              try {
                await char.startNotifications();
                char.addEventListener('characteristicvaluechanged', handleCharacteristicChange);
                addDebug(`    Notifications started`);
              } catch (e) {
                addDebug(`    Could not start notifications: ${e}`);
              }
            }
          }
        } catch (e) {
          addDebug(`  Could not get characteristics: ${e}`);
        }
      }
      
      setIsConnected(true);
      addEvent('Connected to battery');
      
      // Try standard battery service
      try {
        const batteryService = await server.getPrimaryService(BATTERY_SERVICE_UUID as any);
        const batteryLevel = await batteryService.getCharacteristic(BATTERY_LEVEL_UUID as any);
        const value = await batteryLevel.readValue();
        const level = value.getUint8(0);
        setBatteryData(prev => ({ ...prev, soc: level }));
        addDebug(`Battery level: ${level}%`);
      } catch (e) {
        addDebug('Standard battery service not found');
      }
      
    } catch (err: any) {
      addDebug(`Connection error: ${err.message}`);
      setError(`Connection failed: ${err.message}`);
      setIsConnected(false);
    }
  };

  // Parse battery data from characteristic
  const parseBatteryData = async (characteristic: BluetoothRemoteGATTCharacteristic, value: DataView) => {
    const data = new Uint8Array(value.buffer);
    
    // Common parsing patterns for battery data
    // This is where you'll need to figure out the actual data format
    
    // Example: If data length is 2, might be voltage (16-bit)
    if (data.length === 2) {
      const voltage = (data[0] << 8 | data[1]) / 100; // Often voltage is sent as voltage * 100
      if (voltage > 20 && voltage < 30) { // Reasonable range for 24V battery
        setBatteryData(prev => ({ ...prev, voltage }));
        addDebug(`Possible voltage: ${voltage}V`);
      }
    }
    
    // Example: If data length is 4, might be voltage + current
    if (data.length === 4) {
      const voltage = (data[0] << 8 | data[1]) / 100;
      const current = (data[2] << 8 | data[3]) / 100;
      if (voltage > 20 && voltage < 30) {
        setBatteryData(prev => ({ 
          ...prev, 
          voltage,
          current: current - 128, // Often centered at 128 for +/- values
          power: Math.abs(voltage * (current - 128))
        }));
        addDebug(`Possible V: ${voltage}V, I: ${current - 128}A`);
      }
    }
    
    // Example: Longer data might contain multiple values
    if (data.length >= 8) {
      // Try different parsing strategies
      addDebug(`Long data (${data.length} bytes): ${Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
    }
  };

  // Handle characteristic value changes (notifications)
  const handleCharacteristicChange = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value!;
    parseBatteryData(target, value);
  };

  // Handle disconnection
  const onDisconnected = () => {
    addDebug('Device disconnected');
    setIsConnected(false);
    setServer(null);
    addEvent('Disconnected from battery');
  };

  // Disconnect manually
  const disconnect = () => {
    if (device && device.gatt?.connected) {
      device.gatt.disconnect();
    }
    setIsConnected(false);
    setDevice(null);
    setServer(null);
    setBatteryData({
      voltage: 0,
      current: 0,
      soc: 0,
      temperature: 0,
      cycles: 0,
      power: 0,
      status: 'Standby',
      timeToDischarge: '--:--',
      timeToCharge: '--:--'
    });
  };

  // Add event to log
  const addEvent = (message: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    setEventLog(prev => [{time: timeStr, message}, ...prev].slice(0, 10));
  };

  // Get battery status color
  const getBatteryColor = (soc: number) => {
    if (soc > 60) return 'text-green-500';
    if (soc > 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Charging': return 'text-blue-500';
      case 'Discharging': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white max-w-md mx-auto">
      {/* Header */}
      <div className="bg-blue-600 p-4">
        <h1 className="text-xl font-bold text-center">Ionic Battery Monitor (Real BT)</h1>
      </div>

      {/* Permission Note */}
      {showPermissionNote && !isConnected && (
        <div className="m-4 p-3 bg-blue-900/50 border border-blue-500 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Requirements:</p>
              <ul className="text-xs text-gray-300 list-disc list-inside">
                <li>Use Chrome or Edge browser (not Safari)</li>
                <li>On iPhone: Use Bluefy Browser from App Store</li>
                <li>Enable Bluetooth on your device</li>
                <li>Battery must be powered on</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Safari Warning */}
      {typeof navigator !== 'undefined' && !navigator.bluetooth && (
        <div className="m-4 p-3 bg-yellow-900/50 border border-yellow-500 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-400 mb-2">Browser Doesn't Support Bluetooth</p>
              <p className="text-gray-300 mb-2">To connect to your battery:</p>
              <ol className="text-xs text-gray-300 list-decimal list-inside space-y-1">
                <li>On iPhone: Download "Bluefy - Web BLE Browser" from App Store</li>
                <li>On Android: Use Chrome or Edge</li>
                <li>Open this same URL in the supported browser</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="m-4 p-3 bg-red-900/50 border border-red-500 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Connection Section */}
      {!isConnected && (
        <div className="p-4">
          <button
            onClick={startScanning}
            disabled={isScanning}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Searching for Ionic battery...</span>
              </>
            ) : (
              <>
                <Bluetooth className="w-5 h-5" />
                <span>Scan for Real Battery</span>
              </>
            )}
          </button>

          {/* Debug Info */}
          {debugInfo.length > 0 && (
            <div className="mt-4 p-3 bg-gray-800 rounded-lg">
              <h3 className="text-sm font-medium mb-2">Debug Log:</h3>
              <div className="text-xs font-mono space-y-1 max-h-40 overflow-y-auto">
                {debugInfo.map((info, idx) => (
                  <div key={idx} className="text-gray-400">{info}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Battery Dashboard - Only show when connected */}
      {isConnected && (
        <>
          {/* Device Info */}
          <div className="px-4 pt-4">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm">
                <span className="text-gray-400">Connected to: </span>
                <span className="font-medium">{device?.name || 'Unknown Device'}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-800 border-b border-gray-700 mt-4">
            <button
              onClick={() => setActiveTab('basic')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'basic' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'
              }`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('debug')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'debug' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'
              }`}
            >
              Debug
            </button>
          </div>

          <div className="p-4">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                {/* Battery Data */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-medium mb-3">Battery Data</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">State of Charge</span>
                      <span>{batteryData.soc}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Voltage</span>
                      <span>{batteryData.voltage.toFixed(2)}V</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current</span>
                      <span>{batteryData.current.toFixed(2)}A</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Power</span>
                      <span>{batteryData.power.toFixed(2)}W</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Note: Data parsing is experimental. Values may not be accurate until proper protocol is implemented.
                </p>
              </div>
            )}

            {/* Debug Tab */}
            {activeTab === 'debug' && (
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-medium mb-3">Bluetooth Debug Log</h3>
                  <div className="text-xs font-mono space-y-1 max-h-64 overflow-y-auto">
                    {debugInfo.map((info, idx) => (
                      <div key={idx} className="text-gray-400">{info}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Disconnect Button */}
            <button
              onClick={disconnect}
              className="w-full mt-6 bg-red-600 hover:bg-red-700 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Disconnect
            </button>
          </div>
        </>
      )}

      {/* Instructions */}
      {!isConnected && !isScanning && (
        <div className="p-4 mt-4">
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
            <h3 className="font-medium text-yellow-400 mb-2">⚠️ Experimental Feature</h3>
            <p className="text-sm text-gray-300 mb-3">
              This attempts to connect to your real Ionic battery via Web Bluetooth. However, the data protocol is not publicly documented.
            </p>
            <p className="text-sm text-gray-300">
              The app will try to discover services and characteristics, but proper data parsing requires reverse-engineering the Ionic protocol.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IonicBatteryApp;
