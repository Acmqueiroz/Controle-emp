import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from '../pages/Home';
import ContagemDiaria from '../pages/ControleDiario';
import Semana from '../pages/Semana';
import Mes from '../pages/Mes';
import Pagamentos from '../pages/Pagamento'; // <-- corrigido
import Custos from '../pages/Custos';
import NotFound from '../pages/NotFound';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/contagem" element={<ContagemDiaria />} />
    <Route path="/semana" element={<Semana />} />
    <Route path="/mes" element={<Mes />} />
    <Route path="/pagamentos" element={<Pagamentos />} />
    <Route path="/custos" element={<Custos />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
