import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
      fontWeight: 300,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf",
      fontWeight: 500,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    padding: 0,
    fontFamily: "Roboto",
  },
  header: {
    backgroundColor: "#667eea",
    padding: 20,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "#FFFFFF",
    marginBottom: 5,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: 300,
    color: "#FFFFFF",
    textAlign: "center",
    opacity: 0.9,
  },
  container: {
    paddingHorizontal: 25,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#667eea",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: "2px solid #667eea",
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  card: {
    width: "31%",
    borderRadius: 6,
    padding: 12,
    minHeight: 75,
  },
  cardIncome: {
    backgroundColor: "#d4edda",
    borderLeft: "4px solid #28a745",
  },
  cardExpense: {
    backgroundColor: "#f8d7da",
    borderLeft: "4px solid #dc3545",
  },
  cardBalance: {
    backgroundColor: "#d1ecf1",
    borderLeft: "4px solid #17a2b8",
  },
  cardBalanceNegative: {
    backgroundColor: "#f8d7da",
    borderLeft: "4px solid #dc3545",
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: 500,
    color: "#666",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 700,
    color: "#000",
    marginBottom: 3,
  },
  cardSubtext: {
    fontSize: 8,
    color: "#666",
    fontWeight: 400,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 5,
    marginBottom: 6,
  },
  categoryColor: {
    width: 6,
    height: 35,
    borderRadius: 3,
    marginRight: 10,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: 500,
    color: "#333",
    marginBottom: 4,
  },
  categoryValue: {
    fontSize: 12,
    fontWeight: 700,
    color: "#000",
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 7,
    color: "#666",
  },
  progressBar: {
    height: 24,
    backgroundColor: "#e9ecef",
    borderRadius: 12,
    overflow: "hidden",
    flexDirection: "row",
    marginBottom: 10,
  },
  progressSegment: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  progressText: {
    fontSize: 9,
    fontWeight: 700,
    color: "#FFFFFF",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  statBox: {
    width: "48%",
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 5,
  },
  statLabel: {
    fontSize: 8,
    color: "#666",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#000",
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 8,
    color: "#666",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
  },
  summaryBox: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#666",
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 700,
    color: "#000",
  },
  divider: {
    height: 1,
    backgroundColor: "#dee2e6",
    marginVertical: 6,
  },
  highlight: {
    backgroundColor: "#fff3cd",
    padding: 10,
    borderRadius: 5,
    borderLeft: "3px solid #ffc107",
    marginBottom: 10,
  },
  highlightText: {
    fontSize: 9,
    color: "#856404",
    lineHeight: 1.4,
  },
});

interface Transaction {
  id: string;
  description: string;
  value: number;
  type: "income" | "expense";
  category: string;
  date: string;
  recurring_id?: string;
  is_predicted?: boolean;
}

interface FinancialReportPDFProps {
  monthLabel: string;
  transactions: Transaction[];
}

export const FinancialReportPDF: React.FC<FinancialReportPDFProps> = ({
  monthLabel,
  transactions,
}) => {
  const incomes = transactions.filter((t) => t.type === "income");
  const expenses = transactions.filter((t) => t.type === "expense");

  const totalIncome = incomes.reduce((sum, t) => sum + t.value, 0);
  const totalExpense = expenses.reduce((sum, t) => sum + t.value, 0);
  const balance = totalIncome - totalExpense;

  // Agrupar despesas por categoria
  const expensesByCategory: Record<string, number> = {};
  expenses.forEach((t) => {
    expensesByCategory[t.category] =
      (expensesByCategory[t.category] || 0) + t.value;
  });

  const sortedCategories = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Despesas fixas vs variáveis
  const recurringExpenses = expenses.filter(
    (t) => t.recurring_id || t.is_predicted
  );
  const variableExpenses = expenses.filter(
    (t) => !t.recurring_id && !t.is_predicted
  );

  const recurringTotal = recurringExpenses.reduce((sum, t) => sum + t.value, 0);
  const variableTotal = variableExpenses.reduce((sum, t) => sum + t.value, 0);
  const expenseTotal = recurringTotal + variableTotal;

  const recurringPercentage =
    expenseTotal > 0 ? (recurringTotal / expenseTotal) * 100 : 0;
  const variablePercentage =
    expenseTotal > 0 ? (variableTotal / expenseTotal) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const colors = [
    "#dc3545",
    "#ffc107",
    "#28a745",
    "#007bff",
    "#6c757d",
    "#17a2b8",
  ];

  // Calcular média e estatísticas
  const avgIncome = incomes.length > 0 ? totalIncome / incomes.length : 0;
  const avgExpense = expenses.length > 0 ? totalExpense / expenses.length : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Relatório Financeiro</Text>
          <Text style={styles.headerSubtitle}>{monthLabel}</Text>
        </View>

        <View style={styles.container}>
          {/* Cards de Resumo */}
          <View style={styles.cardsRow}>
            <View style={[styles.card, styles.cardIncome]}>
              <Text style={styles.cardLabel}>Receitas</Text>
              <Text style={styles.cardValue}>
                {formatCurrency(totalIncome)}
              </Text>
              <Text style={styles.cardSubtext}>
                {incomes.length} transação(ões)
              </Text>
            </View>

            <View style={[styles.card, styles.cardExpense]}>
              <Text style={styles.cardLabel}>Despesas</Text>
              <Text style={styles.cardValue}>
                {formatCurrency(totalExpense)}
              </Text>
              <Text style={styles.cardSubtext}>
                {expenses.length} transação(ões)
              </Text>
            </View>

            <View
              style={[
                styles.card,
                balance >= 0 ? styles.cardBalance : styles.cardBalanceNegative,
              ]}
            >
              <Text style={styles.cardLabel}>Saldo</Text>
              <Text style={styles.cardValue}>{formatCurrency(balance)}</Text>
              <Text style={styles.cardSubtext}>
                {balance >= 0 ? "Positivo ✓" : "Negativo ✗"}
              </Text>
            </View>
          </View>

          {/* Resumo Geral */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumo Geral</Text>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total de Transações</Text>
                <Text style={styles.summaryValue}>{transactions.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Média de Receitas</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(avgIncome)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Média de Despesas</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(avgExpense)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { fontWeight: 700 }]}>
                  Taxa de Economia
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: balance >= 0 ? "#28a745" : "#dc3545" },
                  ]}
                >
                  {totalIncome > 0
                    ? `${((balance / totalIncome) * 100).toFixed(1)}%`
                    : "0%"}
                </Text>
              </View>
            </View>
          </View>

          {/* Top Categorias de Despesas */}
          {sortedCategories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Top Categorias de Despesas
              </Text>
              <View style={styles.categoriesGrid}>
                {sortedCategories.map(([category, value], index) => {
                  const percentage =
                    totalExpense > 0 ? (value / totalExpense) * 100 : 0;
                  return (
                    <View key={category} style={styles.categoryItem}>
                      <View
                        style={[
                          styles.categoryColor,
                          { backgroundColor: colors[index] },
                        ]}
                      />
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{category}</Text>
                        <Text style={styles.categoryValue}>
                          {formatCurrency(value)}
                        </Text>
                        <Text style={styles.categoryPercentage}>
                          {percentage.toFixed(1)}% do total
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Despesas Fixas vs Variáveis */}
          {expenseTotal > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Despesas Fixas vs Variáveis
              </Text>

              <View style={styles.progressBar}>
                {recurringPercentage > 0 && (
                  <View
                    style={[
                      styles.progressSegment,
                      {
                        width: `${recurringPercentage}%`,
                        backgroundColor: "#667eea",
                      },
                    ]}
                  >
                    {recurringPercentage > 15 && (
                      <Text style={styles.progressText}>
                        {recurringPercentage.toFixed(0)}%
                      </Text>
                    )}
                  </View>
                )}
                {variablePercentage > 0 && (
                  <View
                    style={[
                      styles.progressSegment,
                      {
                        width: `${variablePercentage}%`,
                        backgroundColor: "#f5576c",
                      },
                    ]}
                  >
                    {variablePercentage > 15 && (
                      <Text style={styles.progressText}>
                        {variablePercentage.toFixed(0)}%
                      </Text>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Despesas Fixas</Text>
                  <Text style={styles.statValue}>
                    {formatCurrency(recurringTotal)}
                  </Text>
                  <Text style={styles.statSubtext}>
                    {recurringExpenses.length} transação(ões)
                  </Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Despesas Variáveis</Text>
                  <Text style={styles.statValue}>
                    {formatCurrency(variableTotal)}
                  </Text>
                  <Text style={styles.statSubtext}>
                    {variableExpenses.length} transação(ões)
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Insights */}
          {balance < 0 && (
            <View style={styles.highlight}>
              <Text style={styles.highlightText}>
                ⚠️ Atenção: Suas despesas estão superando suas receitas em{" "}
                {formatCurrency(Math.abs(balance))}. Considere revisar seus
                gastos ou aumentar suas fontes de renda.
              </Text>
            </View>
          )}

          {balance > totalIncome * 0.3 && (
            <View style={styles.highlight}>
              <Text style={styles.highlightText}>
                ✓ Parabéns! Você está economizando{" "}
                {((balance / totalIncome) * 100).toFixed(1)}% de sua renda.
                Continue assim!
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Relatório gerado em {new Date().toLocaleDateString("pt-BR")} às{" "}
          {new Date().toLocaleTimeString("pt-BR")} | Sistema de Gestão
          Financeira
        </Text>
      </Page>
    </Document>
  );
};
