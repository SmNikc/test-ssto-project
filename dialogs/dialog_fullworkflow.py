CopyEdit
from PyQt5.QtWidgets import QDialog, QMessageBox
from ..utils.duty_tablet import DutyTabletManager
class FullWorkflowDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
#         self.setWindowTitle("Контроль последовательности операций")
        self.manager = DutyTabletManager()
        case_data = self.manager.get_case_workflow_data()
        steps = [
#             ("Открытие дела", "case_opened"),
#             ("Ввод LKP", "lkp_defined"),
#             ("Построение района поиска", "search_area_built"),
#             ("Назначение SRU", "sru_assigned"),
#             ("Генерация плана поиска", "plan_generated"),
#             ("Отправка SITREP", "sitrep_sent"),
#             ("Закрытие дела", "case_closed"),
        ]
        step_names = [name for name, key in steps]
        step_keys = [key for name, key in steps]
        done = [case_data.get(k) for k in step_keys]
        for i, flag in enumerate(done):
            if not flag:
#                 QMessageBox.warning(self, "Ошибка", f"Этап '{step_names[i]}' не выполнен! Работу продолжать нельзя.")
                self.reject()
                return
#         QMessageBox.information(self, "Контроль", "Все этапы выполнены правильно!")
        self.accept()
# жду
# Продолжаю публикацию. Следом — все формы .ui, как требуют правила.
