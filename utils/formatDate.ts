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

type MonthFormat = "short" | "long";
const MONTHS_SHORT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

const MONTHS_LONG = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;


export const formatMonth = (month: string, format: MonthFormat = "short"): string => {
  const [year, monthNum] = month.split("-");
  const monthIndex = parseInt(monthNum, 10) - 1;

  const monthName =
    format === "short" ? MONTHS_SHORT[monthIndex] : MONTHS_LONG[monthIndex];

  return format === "short"
    ? `${monthName}/${year}`
    : `${monthName} de ${year}`;
};

export const calculateNextMonth = (currentMonth: string): string => {
  const [year, month] = currentMonth.split("-").map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
};
