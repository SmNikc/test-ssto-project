CopyEdit
class Validator:
    @staticmethod
    def validate_search_area(area_data):
        errors = []
        if not area_data.get("type"):
#             errors.append("Не указан тип района поиска.")
        if not area_data.get("coords"):
#             errors.append("Не указаны координаты района поиска.")
        if not area_data.get("size") or float(area_data.get("size", 0)) <= 0:
#             errors.append("Не указан или некорректен размер/радиус района поиска.")
        return errors
    @staticmethod
    def validate_sru(sru_data):
        errors = []
        if not sru_data.get("callsign"):
#             errors.append("Не указан позывной SRU.")
        if not sru_data.get("type"):
#             errors.append("Не указан тип SRU.")
        if not sru_data.get("eta"):
#             errors.append("Не рассчитано ETA для SRU.")
        return errors
    @staticmethod
    def validate_plan(plan_data):
        errors = []
        for entry in plan_data:
            if not entry.get("srus") or not entry.get("areas"):
#                 errors.append(f"Не все районы поиска или SRU заполнены ({entry})")
        return errors
    @staticmethod
    def validate_workflow(case_data):
        steps_required = [
            "case_opened", "lkp_defined", "search_area_built", "sru_assigned", "plan_generated", "sitrep_sent"
        ]
        for step in steps_required:
            if not case_data.get(step):
                return f"Не выполнен этап: {step}"
        return None
