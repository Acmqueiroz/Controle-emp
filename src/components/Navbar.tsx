import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/">🏠 Home</Link>
      <Link to="/dashboard">📈 Dashboard</Link>
      <Link to="/contagem">📋 Contagem Diária</Link>
      <Link to="/semana">📅 Semana</Link>
      <Link to="/mes">📆 Mês</Link>
      <Link to="/pagamentos">💰 Pagamentos</Link>
      <Link to="/custos">📊 Custos</Link>
      <Link to="/sugestoes">💡 Sugestões</Link>
    </nav>
  );
};

export default Navbar;
