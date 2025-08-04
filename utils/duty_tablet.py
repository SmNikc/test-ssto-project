CopyEdit
class DutyTabletManager:
    def __init__(self):
        self.load_current_case()
    def load_current_case(self):
        pass
    def get_current_case_info(self):
        return "ПСО-2025-123", "№47 (Спасение)", "Старший Иванов И.И."
    def get_current_sru_table(self):
        return [
#             ["Борт1", "Вертолёт", "12:03", "1.2", "Вылетел"],
#             ["Катер12", "Катер", "12:18", "2.1", "В работе"],
        ]
    def get_history_text(self):
        return "10:03 — Дело открыто\n10:05 — Введены координаты LKP\n10:10 — Район поиска построен\n12:03 — Вертолёт вылетел..."
    def export_tablet(self, path):
        if path.endswith(".docx"):
            from docx import Document
            doc = Document()
#             doc.add_heading("Планшет дежурного", 0)
            doc.save(path)
            return True
        elif path.endswith(".csv"):
            import csv
            with open(path, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
#                 writer.writerow(["Позывной", "Тип", "ETA", "Время в районе", "Статус"])
                for row in self.get_current_sru_table():
                    writer.writerow(row)
            return True
        return False
    def print_tablet(self):
        return True
    def get_case_workflow_data(self):
        return {
            "case_opened": True,
            "lkp_defined": True,
            "search_area_built": True,
            "sru_assigned": True,
            "plan_generated": True,
            "sitrep_sent": True,
            "case_closed": False,
        }
