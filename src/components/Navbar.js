import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import './Navbar.css';
const Navbar = () => {
    return (_jsxs("nav", { className: "navbar", children: [_jsx(Link, { to: "/", children: "\uD83C\uDFE0 Home" }), _jsx(Link, { to: "/dashboard", children: "\uD83D\uDCC8 Dashboard" }), _jsx(Link, { to: "/contagem", children: "\uD83D\uDCCB Contagem Di\u00E1ria" }), _jsx(Link, { to: "/semana", children: "\uD83D\uDCC5 Semana" }), _jsx(Link, { to: "/mes", children: "\uD83D\uDCC6 M\u00EAs" }), _jsx(Link, { to: "/pagamentos", children: "\uD83D\uDCB0 Pagamentos" }), _jsx(Link, { to: "/custos", children: "\uD83D\uDCCA Custos" }), _jsx(Link, { to: "/sugestoes", children: "\uD83D\uDCA1 Sugest\u00F5es" })] }));
};
export default Navbar;
