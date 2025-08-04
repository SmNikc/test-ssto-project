CopyEdit
from PyQt5.QtWidgets import QDialog, QMessageBox
from ..forms.RegistrationForm_ui import Ui_RegistrationForm
class RegistrationDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.ui = Ui_RegistrationForm()
        self.ui.setupUi(self)
        self.ui.buttonNext.clicked.connect(self.goto_next)
        self.ui.buttonPrev.clicked.connect(self.goto_prev)
        self.ui.buttonFinish.clicked.connect(self.finish)
        self.ui.stackedWidget.setCurrentIndex(0)
    def goto_next(self):
        idx = self.ui.stackedWidget.currentIndex()
        if idx < self.ui.stackedWidget.count() - 1:
#             self.ui.stackedWidget.setCurrentIndex(idx + 1)
    def goto_prev(self):
        idx = self.ui.stackedWidget.currentIndex()
        if idx > 0:
            self.ui.stackedWidget.setCurrentIndex(idx - 1)
    def finish(self):
        # Проверка и сохранение
        # (реализуйте логику сохранения registration_data)
#         QMessageBox.information(self, "Регистрация", "Случай успешно зарегистрирован!")
        self.accept()
