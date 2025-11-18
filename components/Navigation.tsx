"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar, Nav, Container } from "react-bootstrap";
import { FiHome, FiList, FiSettings, FiTrendingUp } from "react-icons/fi";

export function Navigation() {
  const pathname = usePathname();

  return (
    <Navbar
      expand="lg"
      sticky="top"
      className="mb-4"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Container>
        <Navbar.Brand
          as={Link}
          href="/"
          className="d-flex align-items-center gap-2 text-white"
        >
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: "45px",
              height: "45px",
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "12px",
              backdropFilter: "blur(10px)",
            }}
          >
            <FiTrendingUp size={24} />
          </div>
          <span className="fs-4 fw-bold">Planilha Financeira</span>
        </Navbar.Brand>
        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          className="border-0 text-white"
        />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto gap-2">
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
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
