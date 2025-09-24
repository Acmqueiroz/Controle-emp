import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import Navbar from './components/Navbar';
const App = () => {
    return (_jsxs(BrowserRouter, { children: [_jsx(Navbar, {}), _jsx(AppRoutes, {})] }));
};
export default App;
