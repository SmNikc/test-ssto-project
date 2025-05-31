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

export default App;
