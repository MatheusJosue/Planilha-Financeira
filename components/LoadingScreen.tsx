"use client";

export function LoadingScreen() {
  return (
    <div className="loading-screen">
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
