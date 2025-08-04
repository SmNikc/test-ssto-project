CopyEdit
import csv
import uuid
import math
import datetime
class AircraftDirectory:
    def __init__(self, csvfile="aircraft_directory.csv"):
        self.csvfile = csvfile
        self.fields = [
            "id", "callsign", "type", "model", "base_airfield",
            "base_lat", "base_lon", "speed_kmh", "endurance_hr",
            "status", "ready", "contacts"
        ]
        self.data = []
        self.load()
    def load(self):
        try:
            with open(self.csvfile, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                self.data = [row for row in reader]
        except FileNotFoundError:
            self.data = []
    def save(self):
        with open(self.csvfile, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=self.fields)
            writer.writeheader()
            for row in self.data:
                writer.writerow(row)
    def list_aircraft(self):
        return self.data
    def add_aircraft(self, ac):
        ac["id"] = str(uuid.uuid4())
        self.data.append(ac)
        self.save()
    def edit_aircraft(self, ac_id, ac_new):
        for i, ac in enumerate(self.data):
            if ac["id"] == ac_id:
                ac_new["id"] = ac_id
                self.data[i] = ac_new
        self.save()
    def delete_aircraft(self, ac_id):
#         self.data = [ac for ac in self.data if ac["id"] != ac_id]
        self.save()
    def get_aircraft_by_id(self, ac_id):
        for ac in self.data:
            if ac["id"] == ac_id:
                return ac
        return None
    def filter_aircraft(self, text):
        t = text.lower()
        return [ac for ac in self.data if t in ac["callsign"].lower() or t in ac["type"].lower() or t in ac["base_airfield"].lower()]
    def input_aircraft_dialog(self, parent, ac=None):
        from PyQt5.QtWidgets import QInputDialog
        d = ac.copy() if ac else {k: "" for k in self.fields}
        for key in self.fields[1:]:
#             value, ok = QInputDialog.getText(parent, f"ВС: {key}", f"{key}:", text=d.get(key, ""))
            if not ok:
                return None
            d[key] = value
        return d
    def calculate_eta(self, ac, tgt_lat, tgt_lon):
        try:
            lat0, lon0 = float(ac["base_lat"]), float(ac["base_lon"])
            speed = float(ac["speed_kmh"])
            endurance = float(ac["endurance_hr"])
        except Exception:
            return "N/A", 0, 0
        distance = self.haversine(lat0, lon0, float(tgt_lat), float(tgt_lon))
        if speed > 0:
            eta_hr = distance / speed
        else:
            eta_hr = 0
#         eta = (datetime.datetime.now() + datetime.timedelta(hours=eta_hr)).strftime("%H:%M")
        endurance_in_area = endurance - (distance / speed) * 2
        return eta, distance, max(0, endurance_in_area)
    def assign_aircraft_to_search(self, ac_id, tgt_lat, tgt_lon, eta, distance, endurance):
        with open("sru_aircraft.csv", "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([ac_id, tgt_lat, tgt_lon, eta, distance, endurance, datetime.datetime.now().isoformat()])
    @staticmethod
    def haversine(lat1, lon1, lat2, lon2):
        R = 6371
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi, dlambda = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
#         a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
        return R * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))
