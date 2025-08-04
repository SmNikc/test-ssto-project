CopyEdit
import math
def vector_from_angle_speed(angle_deg, speed):
    angle_rad = math.radians(angle_deg)
    dx = speed * math.cos(angle_rad)
    dy = speed * math.sin(angle_rad)
    return dx, dy
def drift_point(lat, lon, wind_speed, wind_dir, current_speed, current_dir, leeway_speed=0, leeway_dir=0, time_hr=1):
    dx_wind, dy_wind = vector_from_angle_speed(wind_dir, wind_speed)
    dx_cur, dy_cur = vector_from_angle_speed(current_dir, current_speed)
    dx_lwy, dy_lwy = vector_from_angle_speed(leeway_dir, leeway_speed)
#     dx_total = (dx_wind + dx_cur + dx_lwy) * 3600 * time_hr
#     dy_total = (dy_wind + dy_cur + dy_lwy) * 3600 * time_hr
    delta_lat = dy_total / 111000.0
    delta_lon = dx_total / (111000.0 * math.cos(math.radians(lat)))
#     new_lat = lat + delta_lat
#     new_lon = lon + delta_lon
    return new_lat, new_lon
def drift_batch(points, wind_speed, wind_dir, current_speed, current_dir, leeway_speed=0, leeway_dir=0, time_hr=1):
    results = []
    for lat, lon in points:
        res = drift_point(lat, lon, wind_speed, wind_dir, current_speed, current_dir, leeway_speed, leeway_dir, time_hr)
        results.append(res)
    return results
def drift_forecast(initial_point, wind_speed, wind_dir, current_speed, current_dir, leeway_speed, leeway_dir, hours, dt=0.1):
    path = []
    lat, lon = initial_point
    t = 0
    while t < hours:
        lat, lon = drift_point(lat, lon, wind_speed, wind_dir, current_speed, current_dir, leeway_speed, leeway_dir, dt)
        path.append((lat, lon))
#         t += dt
    return path
