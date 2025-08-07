import React from 'react';

interface Signal {
  signal_id: string;
  mmsi: string;
  signal_type: string;
  coordinates: string;
}

const MapComponent: React.FC<{ signals: Signal[] }> = ({ signals }) => {
  return (
    <div style={{ width: '100%', height: '500px', overflow: 'auto', border: '1px solid #ccc' }}>
      <h3>Signals</h3>
      <ul>
        {signals.map(signal => (
          <li key={signal.signal_id}>
            {signal.mmsi} — {signal.coordinates}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MapComponent;
