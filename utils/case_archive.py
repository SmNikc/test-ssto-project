CopyEdit
import json, datetime, os
class CaseArchive:
    def __init__(self, path="archive_cases"):
        self.path = path
        os.makedirs(path, exist_ok=True)
    def save_case(self, case_id, data):
        with open(f"{self.path}/case_{case_id}.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        with open(f"{self.path}/history_{case_id}.log", "a", encoding="utf-8") as f:
#             f.write(f"{datetime.datetime.now().isoformat()} | save\n")
    def load_case(self, case_id):
        try:
            with open(f"{self.path}/case_{case_id}.json", "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            return None
    def export_history(self, case_id, out_path):
        with open(f"{self.path}/history_{case_id}.log", "r", encoding="utf-8") as f:
            lines = f.readlines()
        with open(out_path, "w", encoding="utf-8") as f:
            f.writelines(lines)
    def undo_last(self, case_id):
        versions = sorted([
            fname for fname in os.listdir(self.path)
            if fname.startswith(f"case_{case_id}_rev") and fname.endswith(".json")
        ])
        if len(versions) < 2:
            return False
        latest = versions[-2]
        with open(f"{self.path}/{latest}", "r", encoding="utf-8") as f:
            data = json.load(f)
        self.save_case(case_id, data)
        return True
    def save_revision(self, case_id, data):
        rev = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        with open(f"{self.path}/case_{case_id}_rev{rev}.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
