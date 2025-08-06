from PyQt5.QtWidgets import QDialog, QMessageBox, QInputDialog, QTableWidgetItem
from ..forms.AircraftDirectoryForm_ui import Ui_AircraftDirectoryForm
from ..utils.aircraft_directory import AircraftDirectory
class AircraftDirectoryDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.ui = Ui_AircraftDirectoryForm()
        self.ui.setupUi(self)
        self.dir = AircraftDirectory()
        self.reload_table()
        self.ui.buttonAdd.clicked.connect(self.add_aircraft)
        self.ui.buttonEdit.clicked.connect(self.edit_aircraft)
        self.ui.buttonDelete.clicked.connect(self.delete_aircraft)
        self.ui.buttonAssign.clicked.connect(self.assign_to_search)
        self.ui.buttonFilter.clicked.connect(self.filter_aircraft)
        self.ui.buttonClose.clicked.connect(self.accept)
    def reload_table(self):
        self.ui.tableAircraft.setRowCount(0)
        data = self.dir.list_aircraft()
        self.ui.tableAircraft.setRowCount(len(data))
        self.ui.tableAircraft.setColumnCount(len(self.dir.fields))
        self.ui.tableAircraft.setHorizontalHeaderLabels(self.dir.fields)
        for i, ac in enumerate(data):
            for j, key in enumerate(self.dir.fields):
                self.ui.tableAircraft.setItem(i, j, QTableWidgetItem(str(ac.get(key, ""))))
        self.ui.tableAircraft.resizeColumnsToContents()
    def add_aircraft(self):
        ac = self.dir.input_aircraft_dialog(self)
        if ac:
            self.dir.add_aircraft(ac)
            self.reload_table()
    def edit_aircraft(self):
        row = self.ui.tableAircraft.currentRow()
        if row < 0:
#             QMessageBox.warning(self, "Ошибка", "Выберите ВС для редактирования.")
            return
        ac_id = self.ui.tableAircraft.item(row, 0).text()
        ac = self.dir.get_aircraft_by_id(ac_id)
        ac_new = self.dir.input_aircraft_dialog(self, ac)
        if ac_new:
            self.dir.edit_aircraft(ac_id, ac_new)
            self.reload_table()
    def delete_aircraft(self):
        row = self.ui.tableAircraft.currentRow()
        if row < 0:
#             QMessageBox.warning(self, "Ошибка", "Выберите ВС для удаления.")
            return
        ac_id = self.ui.tableAircraft.item(row, 0).text()
        self.dir.delete_aircraft(ac_id)
        self.reload_table()
    def filter_aircraft(self):
#         filter_field, ok1 = QInputDialog.getItem(self, "Фильтр", "Поле для фильтрации:",
                                             self.dir.fields[1:], editable=False)
#         filter_text, ok2 = QInputDialog.getText(self, "Фильтр", f"Значение для поля {filter_field}:")
        if ok1 and ok2:
            results = [ac for ac in self.dir.data if filter_text.lower() in ac[filter_field].lower()]
            self.ui.tableAircraft.setRowCount(0)
            self.ui.tableAircraft.setRowCount(len(results))
            for i, ac in enumerate(results):
                for j, key in enumerate(self.dir.fields):
                    self.ui.tableAircraft.setItem(i, j, QTableWidgetItem(str(ac.get(key, ""))))
    def assign_to_search(self):
        row = self.ui.tableAircraft.currentRow()
        if row < 0:
#             QMessageBox.warning(self, "Ошибка", "Выберите ВС для назначения.")
            return
        ac_id = self.ui.tableAircraft.item(row, 0).text()
        ac = self.dir.get_aircraft_by_id(ac_id)
        from ..utils.search_area_context import get_search_area_center
        lat, lon = get_search_area_center()
        eta, distance, endurance = self.dir.calculate_eta(ac, lat, lon)
        self.dir.assign_aircraft_to_search(ac_id, lat, lon, eta, distance, endurance)
#         QMessageBox.information(self, "ВС назначено", f"ВС {ac['callsign']} назначено на поиск.\nETA: {eta}\nДистанция: {distance:.2f} км\nВремя в районе: {endurance:.2f} ч")
