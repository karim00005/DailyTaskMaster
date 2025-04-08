import { apiRequest } from "./queryClient";

export async function getClientBalance(clientId: number | string): Promise<string> {
  try {
    const res = await apiRequest("GET", `/api/clients/${clientId}/balance`);
    const data = await res.json();
    return data.balance || "0";
  } catch (error) {
    console.error("Error fetching client balance:", error);
    return "0";
  }
}

export async function updateClientBalance(
  clientId: number | string, 
  amount: number, 
  description: string
): Promise<void> {
  await apiRequest("POST", `/api/clients/${clientId}/updateBalance`, {
    amount,
    description
  });
}

export async function calculateClientBalance(clientId: number | string): Promise<string> {
  try {
    // Get all invoices for this client
    const invoicesRes = await apiRequest("GET", `/api/invoices?clientId=${clientId}`);
    const invoices = await invoicesRes.json();
    
    // Get all transactions for this client
    const transactionsRes = await apiRequest("GET", `/api/transactions?clientId=${clientId}`);
    const transactions = await transactionsRes.json();
    
    // Calculate total from invoices
    const invoiceTotal = invoices.reduce((total: number, inv: any) => {
      return total + (parseFloat(inv.total) || 0);
    }, 0);
    
    // Calculate total from transactions
    const transactionTotal = transactions.reduce((total: number, trans: any) => {
      return trans.type === "income" 
        ? total - (parseFloat(trans.amount) || 0)  // Payment reduces balance
        : total + (parseFloat(trans.amount) || 0); // Expense increases balance
    }, 0);
    
    // Final balance is invoice total minus transaction total
    const balance = (invoiceTotal - transactionTotal).toString();
    return balance;
  } catch (error) {
    console.error("Error calculating client balance:", error);
    return "0";
  }
}

export async function updateClientBalanceFromInvoice(
  clientId: number | string, 
  amount: number, 
  isCredit: boolean = true
): Promise<void> {
  const currentBalance = await getClientBalance(clientId);
  const newBalance = isCredit 
    ? parseFloat(currentBalance) + amount
    : parseFloat(currentBalance) - amount;
    
  await apiRequest("POST", `/api/clients/${clientId}/updateBalance`, {
    balance: newBalance.toString()
  });
}
