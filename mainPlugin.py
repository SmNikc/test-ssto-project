CopyEdit
from PyQt5.QtWidgets import QAction, QMenu, QMenuBar
from qgis.PyQt.QtCore import QObject
from .dialogs.dialog_registration import RegistrationDialog
from .dialogs.dialog_searchareaadvanced import SearchAreaAdvancedDialog
from .dialogs.dialog_sitrep import SitrepDialog
from .dialogs.dialog_aircraftdirectory import AircraftDirectoryDialog
from .dialogs.dialog_aircraftassignmenthistory import AircraftAssignmentHistoryDialog
from .dialogs.dialog_aircraftundoredo import AircraftUndoRedoDialog
from .dialogs.dialog_dutyofficertablet import DutyOfficerTabletDialog
from .dialogs.dialog_plansearch import PlanSearchDialog
from .dialogs.dialog_casearchive import CaseArchiveDialog
from .dialogs.dialog_validator import ValidatorDialog
from .dialogs.dialog_fullworkflow import FullWorkflowDialog
class PoiskMorePlugin(QObject):
    def __init__(self, iface):
        super().__init__()
        self.iface = iface
        self.menu_bar = iface.mainWindow().menuBar()
        self.init_menu()
    def init_menu(self):
#         self.pm_menu = QMenu("Поиск-Море", self.menu_bar)
        self.menu_bar.addMenu(self.pm_menu)
#         self._add_action(self.pm_menu, "Регистрация случая", self.open_registration)
#         self._add_action(self.pm_menu, "Построить район поиска", self.open_search_area_advanced)
#         self._add_action(self.pm_menu, "Отправить SITREP", self.open_sitrep)
#         self._add_action(self.pm_menu, "Планшет дежурного", self.open_duty_tablet)
#         self._add_action(self.pm_menu, "План поиска", self.open_plan_search)
#         self._add_action(self.pm_menu, "Архив дел", self.open_case_archive)
#         self._add_action(self.pm_menu, "Проверка данных", self.open_validator)
#         self._add_action(self.pm_menu, "Контроль workflow", self.open_fullworkflow)
#         self.aircraft_menu = QMenu("Авиация", self.pm_menu)
        self.pm_menu.addMenu(self.aircraft_menu)
#         self._add_action(self.aircraft_menu, "Справочник ВС", self.open_aircraft_directory)
#         self._add_action(self.aircraft_menu, "История назначений ВС", self.open_aircraft_assignment_history)
#         self._add_action(self.aircraft_menu, "Undo/Redo ВС", self.open_aircraft_undo_redo)
    def _add_action(self, menu, text, handler):
        act = QAction(text, self.iface.mainWindow())
        act.triggered.connect(handler)
        menu.addAction(act)
    def open_registration(self):
        dlg = RegistrationDialog(self.iface.mainWindow())
        dlg.exec_()
    def open_search_area_advanced(self):
        dlg = SearchAreaAdvancedDialog(self.iface.mainWindow())
        dlg.exec_()
    def open_sitrep(self):
        dlg = SitrepDialog(self.iface.mainWindow())
        dlg.exec_()
    def open_aircraft_directory(self):
        dlg = AircraftDirectoryDialog(self.iface.mainWindow())
        dlg.exec_()
    def open_aircraft_assignment_history(self):
        dlg = AircraftAssignmentHistoryDialog(self.iface.mainWindow())
        dlg.exec_()
    def open_aircraft_undo_redo(self):
        dlg = AircraftUndoRedoDialog(self.iface.mainWindow())
        dlg.exec_()
    def open_duty_tablet(self):
        dlg = DutyOfficerTabletDialog(self.iface.mainWindow())
        dlg.exec_()
    def open_plan_search(self):
        dlg = PlanSearchDialog(self.iface.mainWindow())
        dlg.exec_()
    def open_case_archive(self):
        dlg = CaseArchiveDialog(self.iface.mainWindow())
        dlg.exec_()
    def open_validator(self):
        dlg = ValidatorDialog(self.iface.mainWindow())
        dlg.exec_()
    def open_fullworkflow(self):
        dlg = FullWorkflowDialog(self.iface.mainWindow())
        dlg.exec_()
