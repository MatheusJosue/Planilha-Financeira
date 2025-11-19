"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Navbar, Nav, Container, Dropdown } from "react-bootstrap";
import {
  FiHome,
  FiList,
  FiSettings,
  FiTrendingUp,
  FiLogOut,
  FiUser,
  FiMoon,
  FiSun,
  FiRepeat,
} from "react-icons/fi";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <Navbar
      expand="lg"
      sticky="top"
      className="py-3"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Container fluid className="px-4">
        <Navbar.Brand
          as={Link}
          href="/"
          className="d-flex align-items-center gap-3 text-white"
        >
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: "50px",
              height: "50px",
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "12px",
              backdropFilter: "blur(10px)",
            }}
          >
            <FiTrendingUp size={26} />
          </div>
          <span className="fs-4 fw-bold">Planilha Financeira</span>
        </Navbar.Brand>
        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          className="border-0 text-white"
        />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto gap-2 align-items-lg-center">
            <Nav.Link
              as={Link}
              href="/"
              active={pathname === "/"}
              className={`d-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-semibold ${
                pathname === "/" ? "bg-white text-primary" : "text-white"
              }`}
              style={{
                transition: "all 0.3s ease",
              }}
            >
              <FiHome size={18} /> Dashboard
            </Nav.Link>
            <Nav.Link
              as={Link}
              href="/transacoes"
              active={pathname === "/transacoes"}
              className={`d-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-semibold ${
                pathname === "/transacoes"
                  ? "bg-white text-primary"
                  : "text-white"
              }`}
              style={{
                transition: "all 0.3s ease",
              }}
            >
              <FiList size={18} /> Transações
            </Nav.Link>
            <Nav.Link
              as={Link}
              href="/recorrentes"
              active={pathname === "/recorrentes"}
              className={`d-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-semibold ${
                pathname === "/recorrentes"
                  ? "bg-white text-primary"
                  : "text-white"
              }`}
              style={{
                transition: "all 0.3s ease",
              }}
            >
              <FiRepeat size={18} /> Recorrentes
            </Nav.Link>
            <Nav.Link
              as={Link}
              href="/configuracoes"
              active={pathname === "/configuracoes"}
              className={`d-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-semibold ${
                pathname === "/configuracoes"
                  ? "bg-white text-primary"
                  : "text-white"
              }`}
              style={{
                transition: "all 0.3s ease",
              }}
            >
              <FiSettings size={18} /> Configurações
            </Nav.Link>

            <Nav.Link
              onClick={toggleTheme}
              className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-semibold text-white cursor-pointer"
              style={{
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
            >
              {theme === "light" ? (
                <>
                  <FiMoon size={18} /> Modo Escuro
                </>
              ) : (
                <>
                  <FiSun size={18} /> Modo Claro
                </>
              )}
            </Nav.Link>

            <Dropdown align="end">
              <Dropdown.Toggle
                variant="light"
                id="user-dropdown"
                className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-semibold"
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  color: "white",
                }}
              >
                <FiUser size={18} />
                <span>
                  {user?.user_metadata?.name || user?.email?.split("@")[0]}
                </span>
              </Dropdown.Toggle>

              <Dropdown.Menu
                style={{
                  borderRadius: "10px",
                  border: "2px solid #e2e8f0",
                  padding: "8px",
                }}
              >
                <Dropdown.Item disabled className="text-muted small">
                  {user?.email}
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item
                  onClick={handleSignOut}
                  className="d-flex align-items-center gap-2 rounded-2"
                  style={{ padding: "10px 12px" }}
                >
                  <FiLogOut size={18} />
                  <span>Sair</span>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
