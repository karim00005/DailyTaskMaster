import { apiRequest } from "./apiRequest";
import { Transaction } from "@shared/schema";

export async function getTransactions(): Promise<Transaction[]> {
  try {
    const response = await apiRequest("GET", "/api/transactions");
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("API error:", error);
    throw error;
  }
}