from PyQt5.QtWidgets import QDialog, QTableWidgetItem, QMessageBox, QPushButton, QVBoxLayout
from ..utils.sru_aircraft import SRUAircraftManager
class AircraftAssignmentHistoryDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
#         self.setWindowTitle("История назначений ВС (SRU)")
        self.resize(1000, 500)
        self.layout = QVBoxLayout(self)
        self.table = self._make_table()
        self.layout.addWidget(self.table)
        self.manager = SRUAircraftManager()
        self.reload_table()
        self.buttonShowMap = QPushButton(self)
#         self.buttonShowMap.setText("Показать все ВС на карте")
        self.layout.addWidget(self.buttonShowMap)
        self.buttonShowMap.clicked.connect(self.show_all_assignments_on_map)
    def _make_table(self):
        from PyQt5.QtWidgets import QTableWidget
        return QTableWidget(self)
    def reload_table(self):
        data = self.manager.assignments
        self.table.setRowCount(len(data))
        self.table.setColumnCount(len(self.manager.fields))
        self.table.setHorizontalHeaderLabels(self.manager.fields)
        for i, row in enumerate(data):
            for j, key in enumerate(self.manager.fields):
                self.table.setItem(i, j, QTableWidgetItem(str(row.get(key, ""))))
        self.table.resizeColumnsToContents()
    def show_all_assignments_on_map(self):
        self.manager.visualize_all_assignments_on_map()
#         QMessageBox.information(self, "Визуализация", "Все назначенные ВС отображены на карте QGIS.")
