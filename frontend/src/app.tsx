import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React from 'react';
import { createRoot } from 'react-dom/client';

import Dashboard from './components/dashboard.component';
import RequestForm from './components/RequestForm';
import TestingForm from './components/testingForm.component';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/request" element={<RequestForm />} />
        <Route path="/testing" element={<TestingForm />} />
      </Routes>
    </Router>
  );
}

const container = document.getElementById('root')!;
createRoot(container).render(<App />);
export default App;
