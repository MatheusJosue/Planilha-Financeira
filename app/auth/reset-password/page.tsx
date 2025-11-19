"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Form,
  Button,
  Alert,
  Container,
  Row,
  Col,
} from "react-bootstrap";
import { FiLock, FiTrendingUp } from "react-icons/fi";
import { createClient } from "@/lib/supabase-client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const supabase = createClient();

  useEffect(() => {
    // Verifica se há uma sessão válida
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMessage("Digite sua nova senha abaixo");
      }
    });
  }, [supabase.auth]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setMessage("Senha alterada com sucesso! Redirecionando...");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <div className="text-center mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center mb-3"
                style={{
                  width: "80px",
                  height: "80px",
                  background: "rgba(255, 255, 255, 0.2)",
                  borderRadius: "20px",
                  backdropFilter: "blur(10px)",
                }}
              >
                <FiTrendingUp size={40} className="text-white" />
              </div>
              <h1 className="text-white fw-bold mb-2">Planilha Financeira</h1>
              <p className="text-white opacity-75">Recuperação de senha</p>
            </div>

            <Card
              className="border-0 shadow-lg"
              style={{
                borderRadius: "20px",
                overflow: "hidden",
              }}
            >
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <h3 className="fw-bold mb-2">Nova Senha</h3>
                  <p className="text-muted small">Digite sua nova senha</p>
                </div>

                {error && (
                  <Alert variant="danger" className="mb-3">
                    {error}
                  </Alert>
                )}

                {message && (
                  <Alert variant="success" className="mb-3">
                    {message}
                  </Alert>
                )}

                <Form onSubmit={handleResetPassword}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Nova Senha</Form.Label>
                    <div className="position-relative">
                      <FiLock
                        className="position-absolute"
                        style={{
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#667eea",
                        }}
                        size={20}
                      />
                      <Form.Control
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        style={{
                          paddingLeft: "40px",
                          borderRadius: "10px",
                          border: "2px solid #e2e8f0",
                          padding: "12px 12px 12px 40px",
                        }}
                      />
                    </div>
                    <Form.Text className="text-muted">
                      Mínimo de 6 caracteres
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">
                      Confirmar Nova Senha
                    </Form.Label>
                    <div className="position-relative">
                      <FiLock
                        className="position-absolute"
                        style={{
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#667eea",
                        }}
                        size={20}
                      />
                      <Form.Control
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        style={{
                          paddingLeft: "40px",
                          borderRadius: "10px",
                          border: "2px solid #e2e8f0",
                          padding: "12px 12px 12px 40px",
                        }}
                      />
                    </div>
                  </Form.Group>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-100 mb-3"
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none",
                      borderRadius: "10px",
                      padding: "12px",
                      fontWeight: "600",
                      fontSize: "1rem",
                    }}
                  >
                    {loading ? "Processando..." : "Alterar Senha"}
                  </Button>

                  <div className="text-center">
                    <Button
                      variant="link"
                      className="text-decoration-none"
                      onClick={() => router.push("/login")}
                      style={{ color: "#667eea", fontWeight: "500" }}
                    >
                      Voltar para o login
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
