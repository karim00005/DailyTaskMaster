import * as XLSX from "xlsx";
import { FileCog, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ExcelExporterProps {
  data: any[];
  filename: string;
  buttonText?: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  showIcon?: boolean;
}

const ExcelExporter = ({ 
  data, 
  filename, 
  buttonText = "تصدير إلى Excel", 
  variant = "outline",
  showIcon = true 
}: ExcelExporterProps) => {
  
  const exportToExcel = () => {
    try {
      if (!data || data.length === 0) {
        toast({
          title: "لا توجد بيانات للتصدير",
          description: "لا يوجد أي سجلات متاحة للتصدير",
          variant: "destructive",
        });
        return;
      }
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      
      // Generate and download Excel file
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      
      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${data.length} سجل إلى ملف Excel`,
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant={variant}
      onClick={exportToExcel}
      className={`${showIcon ? 'flex items-center gap-2' : ''}`}
    >
      {showIcon && <Download className="h-4 w-4" />}
      <span>{buttonText}</span>
    </Button>
  );
};

export default ExcelExporter;