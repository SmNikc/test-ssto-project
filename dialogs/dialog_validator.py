from PyQt5.QtWidgets import QDialog, QMessageBox
from ..utils.validator import Validator
from ..utils.plan_search import PlanSearchManager
from ..utils.duty_tablet import DutyTabletManager
class ValidatorDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
#         self.setWindowTitle("Проверка полноты данных")
        errors = []
        errors.extend(Validator.validate_search_area(DutyTabletManager().get_current_case_info()))
        errors.extend(Validator.validate_plan(PlanSearchManager().get_plan_table()))
        if errors:
#             QMessageBox.critical(self, "Ошибка заполнения", "\n".join(errors))
        else:
#             QMessageBox.information(self, "Контроль", "Все данные заполнены корректно.")
