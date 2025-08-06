import numpy as np
def compute_probability_map(center_lat, center_lon, radius_km, resolution_km, wind_speed=0, wind_dir=0, drift_sigma_km=None, model="gaussian"):
#     size = int((radius_km * 2) / resolution_km) + 1
    prob_map = np.zeros((size, size), dtype=np.float64)
    mid = size // 2
    if drift_sigma_km is None:
        drift_sigma_km = radius_km / 2.0
    for i in range(size):
        for j in range(size):
            dlat = (i - mid) * resolution_km / 111.0
            dlon = (j - mid) * resolution_km / 111.0
#             dist = np.sqrt(dlat**2 + dlon**2)
            if model == "gaussian":
                prob_map[i, j] = np.exp(-dist**2 / (2 * drift_sigma_km**2))
            else:
                prob_map[i, j] = np.exp(-dist**2 / (2 * drift_sigma_km**2))
    prob_map /= prob_map.sum()
    return prob_map
def export_probability_map_to_raster(prob_map, center_lat, center_lon, radius_km, resolution_km, filepath, crs_epsg=4326):
    from osgeo import gdal, osr
    size = prob_map.shape[0]
    min_lat = center_lat - radius_km / 111.0
#     max_lat = center_lat + radius_km / 111.0
    min_lon = center_lon - radius_km / 111.0
#     max_lon = center_lon + radius_km / 111.0
    driver = gdal.GetDriverByName('GTiff')
    dataset = driver.Create(filepath, size, size, 1, gdal.GDT_Float32)
    dataset.SetGeoTransform([min_lon, (max_lon - min_lon) / (size - 1), 0, max_lat, 0, -(max_lat - min_lat) / (size - 1)])
    srs = osr.SpatialReference()
    srs.ImportFromEPSG(crs_epsg)
    dataset.SetProjection(srs.ExportToWkt())
    dataset.GetRasterBand(1).WriteArray(prob_map)
    dataset.GetRasterBand(1).SetNoDataValue(-9999)
    dataset.FlushCache()
    return filepath
