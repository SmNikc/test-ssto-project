import React, { useRef, useEffect, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Point } from 'ol/geom';
import Feature from 'ol/Feature';
import { Style, Icon, Text, Fill, Stroke } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import { Box, FormControlLabel, Switch } from '@mui/material';

interface MarineMapProps {
  signals: any[];
  center?: [number, number];
  zoom?: number;
}

const MarineMap = ({ signals, center = [37.6173, 55.7558], zoom = 4 }: MarineMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [showOpenSeaMap, setShowOpenSeaMap] = useState(true);
  const [showSignals, setShowSignals] = useState(true);

  useEffect(() => {
    if (!mapRef.current) return;

    const osmLayer = new TileLayer({
      source: new OSM()
    });

    const openSeaMapLayer = new TileLayer({
      source: new XYZ({
        attributions: ['© OpenSeaMap contributors'],
        url: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png'
      }),
      visible: showOpenSeaMap
    });

    const signalsSource = new VectorSource();
    const signalsLayer = new VectorLayer({
      source: signalsSource,
      style: function(feature) {
        const signal = feature.get('signal');
        const isEmergency = signal.signal_type === 'DISTRESS' || signal.signal_type === 'REAL_ALERT';
        
        return new Style({
          image: new Icon({
            src: isEmergency ? '/icons/emergency-marker.png' : '/icons/test-marker.png',
            scale: 0.5
          }),
          text: new Text({
            text: signal.vessel_name,
            offsetY: -15,
            font: '12px Arial',
            fill: new Fill({ color: '#000' }),
            stroke: new Stroke({ color: '#fff', width: 2 })
          })
        });
      },
      visible: showSignals
    });

    const map = new Map({
      target: mapRef.current,
      layers: [osmLayer, openSeaMapLayer, signalsLayer],
      view: new View({
        center: fromLonLat(center),
        zoom: zoom
      })
    });

    // Добавление сигналов
    signals.forEach(signal => {
      if (signal.coordinates) {
        const feature = new Feature({
          geometry: new Point(fromLonLat([signal.coordinates.lng, signal.coordinates.lat])),
          signal: signal
        });
        signalsSource.addFeature(feature);
      }
    });

    // Автоматическое масштабирование к сигналам
    if (signals.length > 0) {
      const extent = signalsSource.getExtent();
      if (extent) {
        map.getView().fit(extent, { padding: [50, 50, 50, 50] });
      }
    }

    return () => {
      map.setTarget(undefined);
    };
  }, [signals, center, zoom, showOpenSeaMap, showSignals]);

  return (
    <Box sx={{ position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: '600px' }} />
      <Box sx={{ position: 'absolute', top: 10, right: 10, background: 'white', p: 1, borderRadius: 1 }}>
        <FormControlLabel
          control={<Switch checked={showOpenSeaMap} onChange={(e) => setShowOpenSeaMap(e.target.checked)} />}
          label="Морские метки"
        />
        <FormControlLabel
          control={<Switch checked={showSignals} onChange={(e) => setShowSignals(e.target.checked)} />}
          label="Сигналы"
        />
      </Box>
    </Box>
  );
};

export default MarineMap;