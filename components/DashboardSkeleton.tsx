"use client";

import { Card, Row, Col } from "react-bootstrap";

export function DashboardSkeleton() {
  return (
    <>
      <Row className="g-4 mb-4">
        {[0, 1, 2].map((i) => (
          <Col md={4} key={i}>
            <Card className="border-0 shadow-card h-100">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div style={{ flex: 1 }}>
                    <div
                      className="mb-2 skeleton-pulse"
                      style={{
                        height: "12px",
                        width: "60px",
                        background: "#e2e8f0",
                        borderRadius: "6px",
                      }}
                    />
                    <div
                      className="mb-2 skeleton-pulse"
                      style={{
                        height: "32px",
                        width: "120px",
                        background: "#e2e8f0",
                        borderRadius: "8px",
                      }}
                    />
                    <div
                      className="skeleton-pulse"
                      style={{
                        height: "12px",
                        width: "90px",
                        background: "#e2e8f0",
                        borderRadius: "6px",
                      }}
                    />
                  </div>
                  <div
                    className="rounded-circle skeleton-pulse"
                    style={{
                      width: "70px",
                      height: "70px",
                      background: "#e2e8f0",
                    }}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4">
        <Col lg={6}>
          <Card className="border-0 shadow-card h-100">
            <Card.Body className="p-4">
              <div
                className="mb-3 skeleton-pulse"
                style={{
                  height: "24px",
                  width: "150px",
                  background: "#e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <div
                className="skeleton-pulse"
                style={{
                  height: "300px",
                  background: "#f8f9fa",
                  borderRadius: "12px",
                }}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="border-0 shadow-card h-100">
            <Card.Body className="p-4">
              <div
                className="mb-3 skeleton-pulse"
                style={{
                  height: "24px",
                  width: "150px",
                  background: "#e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <div
                className="skeleton-pulse"
                style={{
                  height: "300px",
                  background: "#f8f9fa",
                  borderRadius: "12px",
                }}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={12}>
          <Card className="border-0 shadow-card">
            <Card.Body className="p-4">
              <div
                className="mb-3 skeleton-pulse"
                style={{
                  height: "24px",
                  width: "150px",
                  background: "#e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <div
                className="skeleton-pulse"
                style={{
                  height: "200px",
                  background: "#f8f9fa",
                  borderRadius: "12px",
                }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
