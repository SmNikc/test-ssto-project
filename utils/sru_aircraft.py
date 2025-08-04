CopyEdit
import csv
import datetime
import uuid
class SRUAircraftManager:
    def __init__(self, file_assign="sru_aircraft.csv", file_history="sru_aircraft_history.csv"):
        self.file_assign = file_assign
        self.file_history = file_history
        self.fields = [
            "assign_id", "ac_id", "callsign", "type", "model", "base_airfield", "tgt_lat", "tgt_lon",
            "eta", "distance_km", "endurance_in_area_hr", "assigned_at"
        ]
        self.history_stack = []
        self.redo_stack = []
        self.load_assignments()
    def load_assignments(self):
        self.assignments = []
        try:
            with open(self.file_assign, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    self.assignments.append(row)
        except FileNotFoundError:
            self.assignments = []
    def save_assignments(self):
        with open(self.file_assign, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=self.fields)
            writer.writeheader()
            for row in self.assignments:
                writer.writerow(row)
    def assign_aircraft(self, ac, tgt_lat, tgt_lon, eta, distance, endurance):
        assign_id = str(uuid.uuid4())
        row = {
            "assign_id": assign_id,
            "ac_id": ac["id"], "callsign": ac["callsign"], "type": ac["type"], "model": ac["model"],
            "base_airfield": ac["base_airfield"],
            "tgt_lat": tgt_lat, "tgt_lon": tgt_lon, "eta": eta, "distance_km": distance,
            "endurance_in_area_hr": endurance, "assigned_at": datetime.datetime.now().isoformat()
        }
        self.history_stack.append(list(self.assignments))
        self.redo_stack.clear()
        self.assignments.append(row)
        self.save_assignments()
        self.append_history("assign", row)
    def remove_assignment(self, assign_id):
        self.history_stack.append(list(self.assignments))
        self.redo_stack.clear()
#         self.assignments = [row for row in self.assignments if row["assign_id"] != assign_id]
        self.save_assignments()
        self.append_history("remove", {"assign_id": assign_id})
    def undo(self):
        if self.history_stack:
            self.redo_stack.append(list(self.assignments))
            self.assignments = self.history_stack.pop()
            self.save_assignments()
    def redo(self):
        if self.redo_stack:
            self.history_stack.append(list(self.assignments))
            self.assignments = self.redo_stack.pop()
            self.save_assignments()
    def export_assignments(self, out_csv):
        with open(out_csv, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=self.fields)
            writer.writeheader()
            for row in self.assignments:
                writer.writerow(row)
    def append_history(self, action, data):
        with open(self.file_history, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([datetime.datetime.now().isoformat(), action, str(data)])
    def load_history(self):
        history = []
        try:
            with open(self.file_history, "r", encoding="utf-8") as f:
                reader = csv.reader(f)
                for row in reader:
                    history.append(row)
        except FileNotFoundError:
            pass
        return history
    def visualize_all_assignments_on_map(self):
        from qgis.core import QgsVectorLayer, QgsFeature, QgsGeometry, QgsPointXY, QgsProject
        for ac in self.assignments:
#             base_layer = QgsVectorLayer("Point?crs=EPSG:4326", f"Аэродром {ac['callsign']}", "memory")
            provider = base_layer.dataProvider()
            feat = QgsFeature()
            feat.setGeometry(QgsGeometry.fromPointXY(QgsPointXY(float(ac["base_lon"]), float(ac["base_lat"]))))
            provider.addFeature(feat)
            base_layer.updateExtents()
            QgsProject.instance().addMapLayer(base_layer)
#             line_layer = QgsVectorLayer("LineString?crs=EPSG:4326", f"Маршрут {ac['callsign']}", "memory")
            provider = line_layer.dataProvider()
            feat = QgsFeature()
            feat.setGeometry(QgsGeometry.fromPolylineXY([
                QgsPointXY(float(ac["base_lon"]), float(ac["base_lat"])),
                QgsPointXY(float(ac["tgt_lon"]), float(ac["tgt_lat"]))
            ]))
            provider.addFeature(feat)
            line_layer.updateExtents()
            QgsProject.instance().addMapLayer(line_layer)
# жду
# Публикую далее. Следующие — все остальные ключевые utils.
