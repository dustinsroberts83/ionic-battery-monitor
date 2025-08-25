'use client'

import React, { useState, useEffect } from 'react';
import { Bluetooth, Battery, Signal, Zap, AlertCircle, Loader2, Smartphone, MapPin, Clock, RotateCw, Info } from 'lucide-react';

const IonicBatteryApp = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [batteryData, setBatteryData] = useState({
    voltage: 0,
    current: 0,
    soc: 0, // State of Charge
    temperature: 0,
    cycles: 0,
    power: 0,
    status: 'Standby',
    timeToDischarge: '--:--',
    timeToCharge: '--:--'
  });
  const [devices, setDevices] = useState<Array<{id: string, name: string, rssi: number, soc: number}>>([]);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [eventLog, setEventLog] = useState<Array<{time: string, message: string}>>([]);
  const [showPermissionNote, setShowPermissionNote] = useState(true);

  // Simulate Bluetooth scanning
  const startScanning = async () => {
    setIsScanning(true);
    setError('');
    setShowPermissionNote(false);
    
    // Simulate finding devices - Note: real app shows all batteries in range
    setTimeout(() => {
      setDevices([
        { id: '1', name: 'IC-24V50-EP', rssi: -45, soc: 75 },
        { id: '2', name: 'IC-24V50-EP', rssi: -72, soc: 82 }
      ]);
      setIsScanning(false);
    }, 2000);
  };

  // Connect to device
  const connectToDevice = async (device: any) => {
    setSelectedDevice(device);
    setError('');
    
    // Simulate connection
    setTimeout(() => {
      setIsConnected(true);
      // Start receiving battery data
      startDataStream();
      // Add connection event
      addEvent('Connected to battery');
    }, 1000);
  };

  // Disconnect
  const disconnect = () => {
    setIsConnected(false);
    setSelectedDevice(null);
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
    addEvent('Disconnected from battery');
  };

  // Add event to log
  const addEvent = (message: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    setEventLog(prev => [{time: timeStr, message}, ...prev].slice(0, 10));
  };

  // Simulate battery data updates
  const startDataStream = () => {
    const interval = setInterval(() => {
      if (!isConnected) {
        clearInterval(interval);
        return;
      }
      
      const voltage = 25.2 + (Math.random() * 1.2 - 0.6);
      const current = Math.random() > 0.5 ? 
        (5.2 + (Math.random() * 2 - 1)) : // Discharging
        -(3.5 + (Math.random() * 1.5 - 0.75)); // Charging
      
      const power = Math.abs(voltage * current);
      const soc = 75 + Math.floor(Math.random() * 10 - 5);
      
      // Calculate time estimates
      const capacity = 50; // 50Ah battery
      const remainingAh = capacity * (soc / 100);
      const timeToDischarge = current > 0 ? (remainingAh / current) : 0;
      const timeToCharge = current < 0 ? ((capacity - remainingAh) / Math.abs(current)) : 0;
      
      setBatteryData({
        voltage: voltage,
        current: current,
        soc: soc,
        temperature: 23 + (Math.random() * 4 - 2),
        cycles: 127,
        power: power,
        status: current > 0 ? 'Discharging' : current < 0 ? 'Charging' : 'Standby',
        timeToDischarge: timeToDischarge > 0 ? `${Math.floor(timeToDischarge)}h ${Math.floor((timeToDischarge % 1) * 60)}m` : '--:--',
        timeToCharge: timeToCharge > 0 ? `${Math.floor(timeToCharge)}h ${Math.floor((timeToCharge % 1) * 60)}m` : '--:--'
      });
    }, 2000);
    
    return () => clearInterval(interval);
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
        <h1 className="text-xl font-bold text-center">IonicBlueBatteries</h1>
      </div>

      {/* Permission Note */}
      {showPermissionNote && !isConnected && (
        <div className="m-4 p-3 bg-blue-900/50 border border-blue-500 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Required Permissions:</p>
              <div className="flex items-center space-x-4 text-xs text-gray-300">
                <span className="flex items-center space-x-1">
                  <Bluetooth className="w-4 h-4" />
                  <span>Bluetooth</span>
                </span>
                <span className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>Location (GPS)</span>
                </span>
              </div>
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
                <span>Searching for batteries...</span>
              </>
            ) : (
              <>
                <Bluetooth className="w-5 h-5" />
                <span>Link Device</span>
              </>
            )}
          </button>

          {/* Device List */}
          {devices.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Available Batteries</h3>
              <div className="space-y-2">
                {devices.map((device) => (
                  <button
                    key={device.id}
                    onClick={() => connectToDevice(device)}
                    className="w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Battery className={`w-6 h-6 ${getBatteryColor(device.soc)}`} />
                        <div className="text-left">
                          <div className="font-medium">{device.name}</div>
                          <div className="text-sm text-gray-400">SOC: {device.soc}%</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Signal className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">{device.rssi} dBm</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Note: Only one device can connect at a time
              </p>
            </div>
          )}
        </div>
      )}

      {/* Battery Dashboard - Only show when connected */}
      {isConnected && (
        <>
          {/* Tabs */}
          <div className="flex bg-gray-800 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('basic')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'basic' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'
              }`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('uitc')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'uitc' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'
              }`}
            >
              U.I.T.C
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'system' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'
              }`}
            >
              System Info
            </button>
          </div>

          <div className="p-4">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                {/* SOC Circle */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <div className="relative w-48 h-48 mx-auto">
                    <svg className="w-48 h-48 transform -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-gray-700"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 88}`}
                        strokeDashoffset={`${2 * Math.PI * 88 * (1 - batteryData.soc / 100)}`}
                        className={getBatteryColor(batteryData.soc)}
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className={`text-5xl font-bold ${getBatteryColor(batteryData.soc)}`}>
                        {batteryData.soc}%
                      </div>
                      <div className="text-gray-400 text-sm">SOC</div>
                    </div>
                  </div>
                </div>

                {/* Voltage and Capacity */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{batteryData.voltage.toFixed(1)}V</div>
                    <div className="text-sm text-gray-400">Voltage</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">50Ah</div>
                    <div className="text-sm text-gray-400">Capacity</div>
                  </div>
                </div>

                {/* Status and Health */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Status</span>
                    <span className={`font-medium ${getStatusColor(batteryData.status)}`}>
                      {batteryData.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Health</span>
                    <span className="font-medium text-green-500">Good</span>
                  </div>
                </div>

                {/* Time Estimates */}
                {batteryData.status !== 'Standby' && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">
                        {batteryData.status === 'Charging' ? 'Time to Full' : 'Time Remaining'}
                      </span>
                      <span className="font-medium">
                        {batteryData.status === 'Charging' ? batteryData.timeToCharge : batteryData.timeToDischarge}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* U.I.T.C Tab */}
            {activeTab === 'uitc' && (
              <div className="space-y-4">
                {/* Voltage and Current Meters */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-center mb-2">
                      <div className="text-3xl font-bold text-yellow-500">{batteryData.voltage.toFixed(1)}</div>
                      <div className="text-sm text-gray-400">Voltage (V)</div>
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-center mb-2">
                      <div className={`text-3xl font-bold ${batteryData.current > 0 ? 'text-orange-500' : 'text-blue-500'}`}>
                        {Math.abs(batteryData.current).toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-400">
                        Current (A) - {batteryData.current > 0 ? 'Discharge' : 'Charge'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Temperature */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Temperature</span>
                    <span className="text-sm text-gray-400">°C</span>
                  </div>
                  <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 via-green-500 to-red-500 transition-all duration-500"
                      style={{ width: `${(batteryData.temperature / 60) * 100}%` }}
                    />
                  </div>
                  <div className="text-center mt-2 text-2xl font-bold">{batteryData.temperature.toFixed(1)}°C</div>
                </div>

                {/* Cycle Life */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Cycle Life</span>
                    <span className="text-sm text-gray-400">/ 5000</span>
                  </div>
                  <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 transition-all duration-500"
                      style={{ width: `${(batteryData.cycles / 5000) * 100}%` }}
                    />
                  </div>
                  <div className="text-center mt-2 text-2xl font-bold">{batteryData.cycles} cycles</div>
                </div>

                {/* Power */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">{batteryData.power.toFixed(1)}W</div>
                    <div className="text-sm text-gray-400">Power Output</div>
                  </div>
                </div>
              </div>
            )}

            {/* System Info Tab */}
            {activeTab === 'system' && (
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-medium mb-3">Event Log</h3>
                  {eventLog.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {eventLog.map((event, index) => (
                        <div key={index} className="text-sm border-b border-gray-700 pb-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">{event.time}</span>
                            <span className="text-white">{event.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-8">No events recorded</p>
                  )}
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-medium mb-3">Battery Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Model</span>
                      <span>IC-24V50-EP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Firmware</span>
                      <span>v2.1.3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">BMS Version</span>
                      <span>1.0.5</span>
                    </div>
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

      {/* Bottom Info */}
      {!isConnected && (
        <div className="p-4 mt-auto">
          <div className="text-center text-xs text-gray-500">
            <p>Bluetooth range: ~10 feet (3 meters)</p>
            <p className="mt-1">Default rename password: 0000</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IonicBatteryApp;