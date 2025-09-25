// frontend/src/components/MarineMap.tsx
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
import { Style, Icon, Text, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import { Box, FormControlLabel, Switch, Tooltip } from '@mui/material';
import Overlay from 'ol/Overlay';

interface MarineMapProps {
  signals: any[];
  center?: [number, number];
  zoom?: number;
}

const MarineMap = ({ signals, center = [37.6173, 55.7558], zoom = 4 }: MarineMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [showOpenSeaMap, setShowOpenSeaMap] = useState(true);
  const [showSignals, setShowSignals] = useState(true);
  const [mapInstance, setMapInstance] = useState<Map | null>(null);

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
        const isTest = signal.signal_type === 'TEST' || signal.signal_type === 'SSAS_TEST';
        
        // Используем встроенные стили вместо внешних иконок
        return new Style({
          image: new CircleStyle({
            radius: 8,
            fill: new Fill({ 
              color: isEmergency ? 'rgba(255, 0, 0, 0.8)' : isTest ? 'rgba(33, 150, 243, 0.8)' : 'rgba(76, 175, 80, 0.8)' 
            }),
            stroke: new Stroke({ 
              color: '#fff', 
              width: 2 
            })
          }),
          text: new Text({
            text: signal.vessel_name || 'Unknown',
            offsetY: -20,
            font: '12px Arial',
            fill: new Fill({ color: '#000' }),
            stroke: new Stroke({ color: '#fff', width: 3 })
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

    // Создаем popup для информации о сигнале
    const popup = new Overlay({
      element: popupRef.current!,
      positioning: 'bottom-center',
      stopEvent: false,
      offset: [0, -10],
    });
    map.addOverlay(popup);

    // Добавление сигналов
    signals.forEach(signal => {
      if (signal.coordinates && signal.coordinates.lat && signal.coordinates.lng) {
        const feature = new Feature({
          geometry: new Point(fromLonLat([signal.coordinates.lng, signal.coordinates.lat])),
          signal: signal
        });
        signalsSource.addFeature(feature);
      }
    });

    // Автоматическое масштабирование к сигналам
    if (signals.length > 0 && signalsSource.getFeatures().length > 0) {
      const extent = signalsSource.getExtent();
      if (extent && extent[0] !== Infinity) {
        map.getView().fit(extent, { 
          padding: [50, 50, 50, 50],
          maxZoom: 10
        });
      }
    }

    // Обработчик клика для popup
    map.on('click', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (feat) => feat);
      
      if (feature && popupRef.current) {
        const signal = feature.get('signal');
        const coordinate = evt.coordinate;
        
        popupRef.current.innerHTML = `
          <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); min-width: 250px;">
            <strong style="font-size: 16px;">${signal.vessel_name || 'Неизвестное судно'}</strong><br/>
            <hr style="margin: 8px 0;"/>
            <strong>MMSI:</strong> ${signal.mmsi || 'Н/Д'}<br/>
            <strong>IMO:</strong> ${signal.imo || 'Н/Д'}<br/>
            <strong>Терминал:</strong> ${signal.terminal_number || 'Н/Д'}<br/>
            <strong>Тип сигнала:</strong> <span style="color: ${signal.signal_type === 'DISTRESS' ? 'red' : 'blue'}">${signal.signal_type || 'Н/Д'}</span><br/>
            <strong>Статус:</strong> ${signal.status || 'Н/Д'}<br/>
            <strong>Координаты:</strong> ${signal.coordinates.lat.toFixed(4)}, ${signal.coordinates.lng.toFixed(4)}<br/>
            <strong>Время:</strong> ${signal.received_at ? new Date(signal.received_at).toLocaleString('ru-RU') : 'Н/Д'}
          </div>
        `;
        popup.setPosition(coordinate);
      } else {
        popup.setPosition(undefined);
      }
    });

    // Изменение курсора при наведении
    map.on('pointermove', (evt) => {
      const pixel = map.getEventPixel(evt.originalEvent);
      const hit = map.hasFeatureAtPixel(pixel);
      if (mapRef.current) {
        mapRef.current.style.cursor = hit ? 'pointer' : '';
      }
    });

    setMapInstance(map);

    return () => {
      map.setTarget(undefined);
    };
  }, [signals, center, zoom]);

  // Обновление видимости слоев
  useEffect(() => {
    if (mapInstance) {
      const layers = mapInstance.getLayers();
      if (layers.getLength() > 1) {
        layers.item(1).setVisible(showOpenSeaMap); // OpenSeaMap layer
      }
      if (layers.getLength() > 2) {
        layers.item(2).setVisible(showSignals); // Signals layer
      }
    }
  }, [showOpenSeaMap, showSignals, mapInstance]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '600px' }} />
      <div ref={popupRef} style={{ position: 'absolute' }} />
      
      <Box sx={{ 
        position: 'absolute', 
        top: 10, 
        right: 10, 
        background: 'rgba(255, 255, 255, 0.95)', 
        p: 1, 
        borderRadius: 1,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <FormControlLabel
          control={<Switch checked={showOpenSeaMap} onChange={(e) => setShowOpenSeaMap(e.target.checked)} />}
          label="Морские метки"
        />
        <FormControlLabel
          control={<Switch checked={showSignals} onChange={(e) => setShowSignals(e.target.checked)} />}
          label="Сигналы"
        />
      </Box>
      
      <Box sx={{ 
        position: 'absolute', 
        bottom: 10, 
        left: 10, 
        background: 'rgba(255, 255, 255, 0.95)', 
        p: 1, 
        borderRadius: 1,
        fontSize: '12px'
      }}>
        <div>🔴 Тревожные сигналы</div>
        <div>🔵 Тестовые сигналы</div>
        <div>🟢 Обычные сигналы</div>
      </Box>
    </Box>
  );
};

export default MarineMap;