CopyEdit
from PyQt5.QtWidgets import QDialog, QMessageBox
from ..forms.SearchAreaAdvancedForm_ui import Ui_SearchAreaAdvancedForm
from ..alg.advanced_search_area import (
    build_area_from_one_point, build_area_from_two_points, build_area_along_line, open_manual_area_editor
)
from qgis.core import QgsProject
class SearchAreaAdvancedDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.ui = Ui_SearchAreaAdvancedForm()
        self.ui.setupUi(self)
        self.ui.buttonBuildArea.clicked.connect(self.build_area)
        self.ui.buttonEditManual.clicked.connect(self.edit_manual_area)
    def build_area(self):
        idx = self.ui.tabWidget.currentIndex()
        if idx == 0:  # от одной точки
            try:
                lat, lon = [float(x.strip()) for x in self.ui.editLatLon1.text().split(",")]
                kind = self.ui.comboAreaType1.currentText()
                radius = self.ui.spinRadius1.value()
                layer = build_area_from_one_point(lat, lon, radius, kind)
                QgsProject.instance().addMapLayer(layer)
            except Exception as e:
#                 QMessageBox.warning(self, "Ошибка", f"Неверные данные: {e}")
        elif idx == 1:  # от двух точек
            try:
                lat1, lon1 = [float(x.strip()) for x in self.ui.editLatLon2a.text().split(",")]
                lat2, lon2 = [float(x.strip()) for x in self.ui.editLatLon2b.text().split(",")]
                kind = self.ui.comboAreaType2.currentText()
                width = self.ui.spinWidth2.value()
                layer = build_area_from_two_points(lat1, lon1, lat2, lon2, width, kind)
                QgsProject.instance().addMapLayer(layer)
            except Exception as e:
#                 QMessageBox.warning(self, "Ошибка", f"Неверные данные: {e}")
        elif idx == 2:  # вдоль линии
            try:
                points = [
                    tuple(map(float, p.split(",")))
                    for p in self.ui.editLineCoords.text().split(";")
                ]
                width = self.ui.spinWidth3.value()
                layer = build_area_along_line(points, width)
                QgsProject.instance().addMapLayer(layer)
            except Exception as e:
#                 QMessageBox.warning(self, "Ошибка", f"Неверные данные: {e}")
    def edit_manual_area(self):
        open_manual_area_editor()
# Продолжаю публикацию (следующие файлы: dialogs/dialog_sitrep.py, dialogs/dialog_aircraftdirectory.py и т.д.) — подряд, до полной ленты!
# жду
# Продолжаю. Лента публикации файлов:
