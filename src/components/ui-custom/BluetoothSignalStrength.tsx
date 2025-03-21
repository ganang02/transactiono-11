
import React from 'react';
import { Battery, Signal } from 'lucide-react';

interface BluetoothSignalStrengthProps {
  rssi?: number;
  className?: string;
}

const BluetoothSignalStrength: React.FC<BluetoothSignalStrengthProps> = ({ rssi, className = '' }) => {
  // If RSSI is not provided, show a placeholder
  if (rssi === undefined) {
    return (
      <div className={`flex items-center ${className}`}>
        <Signal className="h-4 w-4 text-muted-foreground opacity-30" />
      </div>
    );
  }

  // RSSI typically ranges from -100 dBm (very weak) to -30 dBm (very strong)
  // Convert to a 0-4 strength indicator
  let strength = 0;
  
  if (rssi > -60) strength = 4; // Excellent (>-60 dBm)
  else if (rssi > -70) strength = 3; // Good (-70 to -60 dBm)
  else if (rssi > -80) strength = 2; // Fair (-80 to -70 dBm)
  else if (rssi > -90) strength = 1; // Poor (-90 to -80 dBm)
  // else strength = 0; // Very poor (<-90 dBm)

  const bars = [];
  for (let i = 0; i < 4; i++) {
    const isActive = i < strength;
    bars.push(
      <div 
        key={i}
        className={`w-1 mx-[1px] rounded-sm ${isActive ? 'bg-primary' : 'bg-muted'}`}
        style={{ height: `${(i + 1) * 3}px` }}
      />
    );
  }

  let signalText = '';
  let signalColor = '';
  
  if (strength === 4) {
    signalText = 'Excellent';
    signalColor = 'text-green-500';
  } else if (strength === 3) {
    signalText = 'Good';
    signalColor = 'text-green-400';
  } else if (strength === 2) {
    signalText = 'Fair';
    signalColor = 'text-amber-400';
  } else if (strength === 1) {
    signalText = 'Poor';
    signalColor = 'text-amber-500';
  } else {
    signalText = 'Very poor';
    signalColor = 'text-red-500';
  }

  return (
    <div className={`flex flex-col items-end ${className}`}>
      <div className="flex items-end h-3">
        {bars}
      </div>
      <span className={`text-[10px] ${signalColor}`}>{signalText}</span>
    </div>
  );
};

export default BluetoothSignalStrength;
