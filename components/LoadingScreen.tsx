"use client";

export function LoadingScreen() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div className="text-center">
        <div
          className="spinner-border text-white mb-3"
          role="status"
          style={{ width: "3rem", height: "3rem" }}
        >
          <span className="visually-hidden">Carregando...</span>
        </div>
        <h4 className="text-white fw-bold">Planilha Financeira</h4>
        <p className="text-white opacity-75">Carregando...</p>
      </div>
    </div>
  );
}
