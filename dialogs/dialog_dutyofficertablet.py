CopyEdit
from PyQt5.QtWidgets import QDialog, QMessageBox, QFileDialog, QTableWidgetItem
from ..forms.DutyOfficerTabletForm_ui import Ui_DutyOfficerTabletForm
from ..utils.duty_tablet import DutyTabletManager
class DutyOfficerTabletDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.ui = Ui_DutyOfficerTabletForm()
        self.ui.setupUi(self)
        self.manager = DutyTabletManager()
        self.update_ui()
        self.ui.buttonExport.clicked.connect(self.export_tablet)
        self.ui.buttonPrint.clicked.connect(self.print_tablet)
        self.ui.buttonClose.clicked.connect(self.accept)
    def update_ui(self):
        case, op, officer = self.manager.get_current_case_info()
        self.ui.labelCase.setText(case)
        self.ui.labelOperation.setText(op)
        self.ui.labelOfficer.setText(officer)
        sru_data = self.manager.get_current_sru_table()
        self.ui.tableSRU.setRowCount(len(sru_data))
        self.ui.tableSRU.setColumnCount(len(sru_data[0]) if sru_data else 0)
        for i, row in enumerate(sru_data):
            for j, value in enumerate(row):
                self.ui.tableSRU.setItem(i, j, QTableWidgetItem(str(value)))
        self.ui.textHistory.setText(self.manager.get_history_text())
    def export_tablet(self):
#         path, _ = QFileDialog.getSaveFileName(self, "Экспорт", "", "DOCX (*.docx);;PDF (*.pdf);;CSV (*.csv)")
        if path:
            ok = self.manager.export_tablet(path)
#             QMessageBox.information(self, "Экспорт", "Экспортировано." if ok else "Ошибка экспорта.")
    def print_tablet(self):
        self.manager.print_tablet()
#         QMessageBox.information(self, "Печать", "Документ отправлен на печать.")
