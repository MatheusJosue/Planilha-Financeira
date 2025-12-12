import { ReactNode } from "react";

interface PageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export const PageLayout = ({ title, subtitle, children }: PageLayoutProps) => {
  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h1 className="display-5 fw-bold gradient-text mb-2">{title}</h1>
        <p className="text-muted">{subtitle}</p>
      </div>

      {children}
    </div>
  );
};