from qgis.core import QgsVectorLayer, QgsFeature, QgsGeometry, QgsPointXY
def build_area_from_one_point(lat, lon, radius_km, kind):
    import math
    points = []
    n_points = 64
    if kind == "Круг":
        for i in range(n_points):
            angle = 2 * math.pi * i / n_points
            dlat = (radius_km / 111.0) * math.cos(angle)
            dlon = (radius_km / (111.0 * math.cos(math.radians(lat)))) * math.sin(angle)
#             points.append(QgsPointXY(lon + dlon, lat + dlat))
    elif kind == "Квадрат":
        delta = radius_km / 111.0
        points = [
            QgsPointXY(lon - delta, lat - delta),
#             QgsPointXY(lon + delta, lat - delta),
#             QgsPointXY(lon + delta, lat + delta),
#             QgsPointXY(lon - delta, lat + delta),
            QgsPointXY(lon - delta, lat - delta)
        ]
#     layer = QgsVectorLayer("Polygon?crs=EPSG:4326", "Район поиска", "memory")
    provider = layer.dataProvider()
    feat = QgsFeature()
    feat.setGeometry(QgsGeometry.fromPolygonXY([points]))
    provider.addFeature(feat)
    layer.updateExtents()
    return layer
def build_area_from_two_points(lat1, lon1, lat2, lon2, width_km, kind):
    from qgis.core import QgsPointXY
    import math
    if kind == "Прямоугольник":
        # построить прямоугольник с шириной width_km между двумя точками
        dx = lat2 - lat1
        dy = lon2 - lon1
        angle = math.atan2(dy, dx)
        width_deg = width_km / 111.0
#         perp_dx = width_deg * math.cos(angle + math.pi/2)
#         perp_dy = width_deg * math.sin(angle + math.pi/2)
#         p1 = QgsPointXY(lon1 + perp_dy, lat1 + perp_dx)
#         p2 = QgsPointXY(lon2 + perp_dy, lat2 + perp_dx)
        p3 = QgsPointXY(lon2 - perp_dy, lat2 - perp_dx)
        p4 = QgsPointXY(lon1 - perp_dy, lat1 - perp_dx)
        points = [p1, p2, p3, p4, p1]
    else: # Полоса — как два параллельных отрезка
        points = []
#     layer = QgsVectorLayer("Polygon?crs=EPSG:4326", "Район от двух точек", "memory")
    provider = layer.dataProvider()
    feat = QgsFeature()
    feat.setGeometry(QgsGeometry.fromPolygonXY([points]))
    provider.addFeature(feat)
    layer.updateExtents()
    return layer
def build_area_along_line(points, width_km):
    # points — [(lat, lon), ...]
    from qgis.core import QgsPointXY
    import math
    width_deg = width_km / 111.0
    left = []
    right = []
    for i in range(len(points)):
        lat, lon = points[i]
        # Вектор "влево" на ширину width/2
#         perp_lat = lat + width_deg/2
        perp_lon = lon
        left.append(QgsPointXY(perp_lon, perp_lat))
        perp_lat = lat - width_deg/2
        right.append(QgsPointXY(perp_lon, perp_lat))
#     poly = left + right[::-1] + [left[0]]
#     layer = QgsVectorLayer("Polygon?crs=EPSG:4326", "Полоса вдоль линии", "memory")
    provider = layer.dataProvider()
    feat = QgsFeature()
    feat.setGeometry(QgsGeometry.fromPolygonXY([poly]))
    provider.addFeature(feat)
    layer.updateExtents()
    return layer
def open_manual_area_editor():
    # Здесь — вызов диалога ручного построения (см. dialogs/dialog_editareamanual.py)
    pass
