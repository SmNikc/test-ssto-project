<<<<<<< HEAD
import config from 'config';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RequestForm from './components/RequestForm';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RequestForm />} />
      </Routes>
    </Router>
  );
};

=======
CopyEdit
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/dashboard.component';
import RequestForm from './components/RequestForm';
import Auth from './components/auth.component';
import MapComponent from './components/map.component';
import TestingForm from './components/testingForm.component';
const App: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/request" element={<RequestForm />} />
      <Route path="/map" element={<MapComponent signals={[]} />} />
      <Route path="/testing" element={<TestingForm />} />
    </Routes>
  </Router>
);
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
export default App;
