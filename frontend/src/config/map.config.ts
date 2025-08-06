import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
# // Настройка OpenSea Map как источника данных для карты
export const openSeaMapLayer = new TileLayer({
  source: new XYZ({
    url: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
#     attributions: 'Map data © <a href="http://www.openseamap.org">OpenSeaMap</a> contributors',
  }),
# });
# // Базовый слой OpenStreetMap
export const osmLayer = new TileLayer({
  source: new XYZ({
    url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
#     attributions: 'Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }),
# });
