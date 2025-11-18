import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
};

export const formatMonthYear = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "MMMM/yyyy", { locale: ptBR });
};

export const getMonthYearKey = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "yyyy-MM");
};

export const getTodayISO = (): string => {
  return format(new Date(), "yyyy-MM-dd");
};
