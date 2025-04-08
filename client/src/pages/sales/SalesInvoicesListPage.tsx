import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
// ...existing imports...
export default function SalesInvoicesListPage() {
  const { data: invoices, refetch } = useQuery({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/invoices");
      return await res.json();
    },
    refetchOnWindowFocus: true, // or set as needed
  });

  useEffect(() => {
    refetch(); // ensure data is refetched when component mounts
  }, [refetch]);

  return (
    // ...existing code rendering invoices...
    <div>
      {invoices?.map(invoice => (
        <div key={invoice.id}>
          {invoice.invoiceNumber} - {invoice.clientName}
        </div>
      ))}
    </div>
  );
}
