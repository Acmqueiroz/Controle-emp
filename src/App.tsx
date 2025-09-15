import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';

import Navbar from './components/Navbar';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <AppRoutes />
    </BrowserRouter>
  );
};


export default App;
