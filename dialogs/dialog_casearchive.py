CopyEdit
from PyQt5.QtWidgets import QDialog, QTableWidgetItem, QMessageBox, QFileDialog, QVBoxLayout, QTableWidget, QPushButton, QHBoxLayout
from ..utils.case_archive import CaseArchive
import datetime
class CaseArchiveDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
#         self.setWindowTitle("Архив поисковых дел")
        self.archive = CaseArchive()
        self.layout = QVBoxLayout(self)
        self.table = QTableWidget(self)
        self.layout.addWidget(self.table)
        self.btn_layout = QHBoxLayout()
#         self.btn_restore = QPushButton("Восстановить")
#         self.btn_export = QPushButton("Экспорт истории")
#         self.btn_undo = QPushButton("Откатить последнюю правку")
        self.btn_layout.addWidget(self.btn_restore)
        self.btn_layout.addWidget(self.btn_export)
        self.btn_layout.addWidget(self.btn_undo)
        self.layout.addLayout(self.btn_layout)
        self.btn_restore.clicked.connect(self.restore_case)
        self.btn_export.clicked.connect(self.export_history)
        self.btn_undo.clicked.connect(self.undo_last)
        self.reload_table()
    def reload_table(self):
        import os
        cases = [f for f in os.listdir(self.archive.path) if f.startswith("case_") and f.endswith(".json") and "_rev" not in f]
        self.table.setRowCount(len(cases))
        self.table.setColumnCount(2)
#         self.table.setHorizontalHeaderLabels(["ID", "Дата"])
        for i, fname in enumerate(cases):
            case_id = fname.split("_")[1].split(".")[0]
            date = os.path.getmtime(f"{self.archive.path}/{fname}")
            self.table.setItem(i, 0, QTableWidgetItem(case_id))
            self.table.setItem(i, 1, QTableWidgetItem(str(datetime.datetime.fromtimestamp(date))))
    def restore_case(self):
        row = self.table.currentRow()
        if row < 0:
            return
        case_id = self.table.item(row, 0).text()
        data = self.archive.load_case(case_id)
#         QMessageBox.information(self, "Восстановление", f"Дело {case_id} восстановлено.")
    def export_history(self):
        row = self.table.currentRow()
        if row < 0:
            return
        case_id = self.table.item(row, 0).text()
#         path, _ = QFileDialog.getSaveFileName(self, "Экспорт истории", "", "TXT (*.txt)")
        if path:
            self.archive.export_history(case_id, path)
#             QMessageBox.information(self, "Экспорт", f"История дела {case_id} экспортирована.")
    def undo_last(self):
        row = self.table.currentRow()
        if row < 0:
            return
        case_id = self.table.item(row, 0).text()
        ok = self.archive.undo_last(case_id)
#         QMessageBox.information(self, "Откат", "Последняя правка отменена." if ok else "Откат невозможен.")
