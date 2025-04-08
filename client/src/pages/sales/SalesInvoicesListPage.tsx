import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Invoice, Client } from "@shared/schema";

export default function SalesInvoicesListPage() {
  // Query invoices (assumed to be sales invoices)
  const { data: invoices, isLoading: loadingInvoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", "sale"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/invoices?type=sale");
      return await res.json();
    },
  });

  // Query clients
  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clients");
      return await res.json();
    },
  });

  // Map invoices to include the client name based on client_id
  const invoicesWithClientNames = invoices?.map(invoice => {
    const client = clients?.find(c => c.id === invoice.clientId);
    return {
      ...invoice,
      clientName: client?.name || ""  // if no client found, leave empty (or use a fallback text)
    };
  });

  return (
    <div className="p-6">
      {loadingInvoices ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full">
          <thead>
            <tr>
              <th>رقم الفاتورة</th>
              <th>العميل</th>
              <th>التاريخ</th>
              {/* ...other headers... */}
            </tr>
          </thead>
          <tbody>
            {invoicesWithClientNames && invoicesWithClientNames.length > 0 ? (
              invoicesWithClientNames.map(inv => (
                <tr key={inv.id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>{inv.clientName}</td>
                  <td>{new Date(inv.date).toLocaleDateString("ar-EG")}</td>
                  {/* ...other cells... */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center">
                  لا توجد بيانات للعرض
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
