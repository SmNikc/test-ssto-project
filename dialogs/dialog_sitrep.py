CopyEdit
from PyQt5.QtWidgets import QDialog, QMessageBox
from ..forms.SitrepForm_ui import Ui_SitrepForm
from ..utils.report_generator import generate_sitrep_docx
from ..utils.sru_aircraft import SRUAircraftManager
class SitrepDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.ui = Ui_SitrepForm()
        self.ui.setupUi(self)
        self.ui.buttonSend.clicked.connect(self.on_send)
    def on_send(self):
        data = {
            "category": self.ui.comboCategory.currentText(),
            "datetime": self.ui.dateTimeUtc.dateTime().toString(),
            "from": self.ui.editFrom.text(),
            "to": self.ui.editTo.text(),
            "object": self.ui.editObject.text(),
            "location": self.ui.editLocation.text(),
            "lat": self.ui.editLat.text(),
            "lon": self.ui.editLon.text(),
            "situation": self.ui.textSituation.toPlainText(),
            "weather": self.ui.textWeather.toPlainText(),
            "search_area": self.ui.textSearchArea.toPlainText(),
            "mmsi": self.ui.editMMSI.text(),
            "size": self.ui.editSize.text(),
        }
        sru_manager = SRUAircraftManager()
        out_docx = "SITREP.docx"
        generate_sitrep_docx(data, out_docx, sru_manager=sru_manager)
#         QMessageBox.information(self, "SITREP", f"SITREP сгенерирован: {out_docx}")
        self.accept()
