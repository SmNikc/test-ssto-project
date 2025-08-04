CopyEdit
from PyQt5.QtWidgets import QDialog, QMessageBox, QFileDialog, QTableWidgetItem
from ..forms.PlanSearchForm_ui import Ui_PlanSearchForm
from ..utils.plan_search import PlanSearchManager
class PlanSearchDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.ui = Ui_PlanSearchForm()
        self.ui.setupUi(self)
        self.manager = PlanSearchManager()
        self.update_ui()
        self.ui.buttonExport.clicked.connect(self.export_plan)
        self.ui.buttonClose.clicked.connect(self.accept)
    def update_ui(self):
        table_data = self.manager.get_plan_table()
        self.ui.tablePlan.setRowCount(len(table_data))
        self.ui.tablePlan.setColumnCount(len(table_data[0]) if table_data else 0)
        for i, row in enumerate(table_data):
            for j, value in enumerate(row):
                self.ui.tablePlan.setItem(i, j, QTableWidgetItem(str(value)))
        self.ui.tablePlan.resizeColumnsToContents()
    def export_plan(self):
#         path, _ = QFileDialog.getSaveFileName(self, "Экспорт", "", "DOCX (*.docx);;CSV (*.csv)")
        if path:
            ok = self.manager.export_plan(path)
#             QMessageBox.information(self, "Экспорт", "Экспортировано." if ok else "Ошибка экспорта.")
