"use client";

import { useState } from "react";
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
import { FiMail, FiLock, FiTrendingUp, FiUser } from "react-icons/fi";
import { createClient } from "@/lib/supabase-client";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) throw error;

      setMessage(
        "Cadastro realizado! Verifique seu email para confirmar sua conta."
      );
      setEmail("");
      setPassword("");
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
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
              <p className="text-white opacity-75">
                Gerencie suas finanças com facilidade
              </p>
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
                  <h3 className="fw-bold mb-2">
                    {isLogin ? "Entrar" : "Criar Conta"}
                  </h3>
                  <p className="text-muted small">
                    {isLogin
                      ? "Acesse sua conta para continuar"
                      : "Preencha os dados para criar sua conta"}
                  </p>
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

                <Form onSubmit={isLogin ? handleLogin : handleSignUp}>
                  {!isLogin && (
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Nome</Form.Label>
                      <div className="position-relative">
                        <FiUser
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
                          type="text"
                          placeholder="Seu nome"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          style={{
                            paddingLeft: "40px",
                            borderRadius: "10px",
                            border: "2px solid #e2e8f0",
                            padding: "12px 12px 12px 40px",
                          }}
                        />
                      </div>
                    </Form.Group>
                  )}

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Email</Form.Label>
                    <div className="position-relative">
                      <FiMail
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
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                          paddingLeft: "40px",
                          borderRadius: "10px",
                          border: "2px solid #e2e8f0",
                          padding: "12px 12px 12px 40px",
                        }}
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Senha</Form.Label>
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
                    {!isLogin && (
                      <Form.Text className="text-muted">
                        Mínimo de 6 caracteres
                      </Form.Text>
                    )}
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
                    {loading
                      ? "Processando..."
                      : isLogin
                      ? "Entrar"
                      : "Criar Conta"}
                  </Button>

                  <div className="text-center">
                    <Button
                      variant="link"
                      className="text-decoration-none"
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setError("");
                        setMessage("");
                      }}
                      style={{ color: "#667eea", fontWeight: "500" }}
                    >
                      {isLogin
                        ? "Não tem conta? Cadastre-se"
                        : "Já tem conta? Faça login"}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            <p className="text-center text-white mt-4 small opacity-75">
              Seus dados são protegidos e criptografados
            </p>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
