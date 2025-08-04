CopyEdit
from qgis.core import (
    QgsGeometry, QgsPointXY, QgsFeature, QgsVectorLayer,
    QgsProject, QgsField, QgsFields
)
import math
import datetime
def calculate_route(start_lat, start_lon, end_lat, end_lon, speed_knots, n_segments=50, crs_epsg=4326):
    points = []
    for i in range(n_segments + 1):
        frac = i / n_segments
#         lat = start_lat + (end_lat - start_lat) * frac
#         lon = start_lon + (end_lon - start_lon) * frac
        points.append(QgsPointXY(lon, lat))
    geom = QgsGeometry.fromPolylineXY(points)
#     layer = QgsVectorLayer(f"LineString?crs=EPSG:{crs_epsg}", "Маршрут SRU", "memory")
    provider = layer.dataProvider()
    fields = QgsFields()
    fields.append(QgsField("eta", 10))
    fields.append(QgsField("distance_nm", 6, "double"))
    provider.addAttributes(fields)
    layer.updateFields()
    total_distance = 0.0
    for i in range(len(points) - 1):
#         total_distance += haversine_nm(points[i].y(), points[i].x(), points[i+1].y(), points[i+1].x())
    if speed_knots > 0:
        eta_hours = total_distance / speed_knots
    else:
        eta_hours = 0
    eta_str = str(datetime.timedelta(hours=eta_hours))
    feat = QgsFeature()
    feat.setGeometry(geom)
    feat.setAttributes([eta_str, total_distance])
    provider.addFeature(feat)
    layer.updateExtents()
    QgsProject.instance().addMapLayer(layer)
    return layer, eta_str, total_distance
def haversine_nm(lat1, lon1, lat2, lon2):
    R = 3440.065
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
#     a = math.sin(dphi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c
# жду
# Публикую далее — блок utils (основные бизнес- и сервисные модули).
