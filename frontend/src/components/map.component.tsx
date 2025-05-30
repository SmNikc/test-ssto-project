import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import { openSeaMapLayer, osmLayer } from '../config/map.config';

interface Signal {
  signal_id: string;
  mmsi: string;
  signal_type: string;
  coordinates: string;
}

const MapComponent: React.FC<{ signals: Signal[] }> = ({ signals }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const vectorSource = new VectorSource();
    signals.forEach((signal) => {
      if (signal.coordinates) {
        const [lat, lon] = signal.coordinates.split(',').map(Number);
        const feature = new Feature({
          geometry: new Point(fromLonLat([lon, lat])),
          signal,
        });
        vectorSource.addFeature(feature);
      }
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: (feature) => {
        const signalType = (feature.get('signal') as Signal).signal_type;
        const iconSrc = signalType === 'alert' ? '/icons/alert.png' : signalType === 'test' ? '/icons/test.png' : '/icons/unscheduled.png';
        return new Style({
          image: new Icon({
            src: iconSrc,
            scale: 0.1,
          }),
        });
      },
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        osmLayer, // Базовый слой OpenStreetMap
        openSeaMapLayer, // Слой OpenSea Map для морских данных
        vectorLayer, // Слой с сигналами
      ],
      view: new View({
        center: fromLonLat([37.5678, 55.1234]), // Примерные координаты для центрирования
        zoom: 5,
      }),
    });

    return () => map.setTarget(undefined);
  }, [signals]);

  return <div ref={mapRef} style={{ width: '100%', height: '500px' }} />;
};

export default MapComponent;
