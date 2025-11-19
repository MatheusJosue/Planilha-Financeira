"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Navbar,
  Nav,
  Container,
  Dropdown,
  Badge,
  Button,
} from "react-bootstrap";
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
  FiBell,
} from "react-icons/fi";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useFinanceStore } from "@/store/financeStore";
import { useMemo } from "react";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { transactions } = useFinanceStore();

  const pendingCount = useMemo(() => {
    if (typeof window === "undefined") return 0;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const pending = transactions.filter((t) => {
      if (!t.is_predicted) return false;
      if (t.is_paid !== undefined) return false;
      return t.date <= todayStr;
    });

    const dismissedKey = `dismissed-recurring-${todayStr}`;
    const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || "[]");

    return pending.filter((t) => !dismissed.includes(t.id)).length;
  }, [transactions]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <Navbar
      expand="lg"
      sticky="top"
      className="mb-4 py-3"
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

            {pendingCount > 0 && (
              <div className="position-relative">
                <Button
                  variant="light"
                  className="rounded-circle p-2 d-flex align-items-center justify-content-center"
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "none",
                    color: "white",
                    width: "40px",
                    height: "40px",
                  }}
                  onClick={() => {
                    const event = new CustomEvent("openRecurringNotifications");
                    window.dispatchEvent(event);
                  }}
                >
                  <FiBell size={18} />
                </Button>
                <Badge
                  bg="danger"
                  className="position-absolute top-0 start-100 translate-middle rounded-circle"
                  style={{ fontSize: "0.65rem", padding: "0.3rem 0.45rem" }}
                >
                  {pendingCount}
                </Badge>
              </div>
            )}

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
