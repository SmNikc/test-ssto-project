from PyQt5.QtWidgets import QDialog, QPushButton, QVBoxLayout, QMessageBox
from ..utils.sru_aircraft import SRUAircraftManager
class AircraftUndoRedoDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
#         self.setWindowTitle("Undo/Redo ВС")
        self.manager = SRUAircraftManager()
        self.layout = QVBoxLayout(self)
#         self.undo_btn = QPushButton("Отменить последнее назначение", self)
#         self.redo_btn = QPushButton("Вернуть отменённое", self)
        self.layout.addWidget(self.undo_btn)
        self.layout.addWidget(self.redo_btn)
        self.undo_btn.clicked.connect(self.do_undo)
        self.redo_btn.clicked.connect(self.do_redo)
    def do_undo(self):
        self.manager.undo()
#         QMessageBox.information(self, "Undo", "Отмена выполнена.")
    def do_redo(self):
        self.manager.redo()
#         QMessageBox.information(self, "Redo", "Возврат выполнен.")
# жду
# Публикую далее, строго в выбранном формате.
