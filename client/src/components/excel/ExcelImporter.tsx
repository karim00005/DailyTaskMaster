import { useState, useRef } from "react";
import { Upload, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useSettings } from "@/context/SettingsContext";

interface ExcelImporterProps {
  templateData: any[];
  templateFilename: string;
  onDataImported: (data: any[]) => void;
  placeholderText?: string;
  templateHeaders?: string[];
}

const ExcelImporter = ({
  templateData,
  templateFilename,
  onDataImported,
  placeholderText = "قم بسحب وإفلات ملف Excel هنا أو انقر للتصفح",
  templateHeaders
}: ExcelImporterProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { rtlMode } = useSettings();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert sheet to JSON
        const importedData = XLSX.utils.sheet_to_json(sheet);
        
        if (importedData.length === 0) {
          toast({
            title: "خطأ في الاستيراد",
            description: "الملف فارغ أو غير صالح",
            variant: "destructive",
          });
          return;
        }
        
        // Validate headers if provided
        if (templateHeaders) {
          // Get headers from imported file
          const importedHeaders = Object.keys(importedData[0]);
          const missingHeaders = templateHeaders.filter(header => !importedHeaders.includes(header));
          
          if (missingHeaders.length > 0) {
            toast({
              title: "خطأ في الاستيراد",
              description: `العناوين التالية مفقودة: ${missingHeaders.join(", ")}`,
              variant: "destructive",
            });
            return;
          }
        }
        
        onDataImported(importedData);
        
        toast({
          title: "تم الاستيراد بنجاح",
          description: `تم استيراد ${importedData.length} سجل`,
        });
        
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Error processing Excel file:", error);
        toast({
          title: "خطأ في الاستيراد",
          description: "فشل استيراد الملف. تأكد من صحة تنسيق الملف",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    try {
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      
      // Generate and download Excel file
      XLSX.writeFile(workbook, `${templateFilename}.xlsx`);
      
      toast({
        title: "تم تنزيل القالب بنجاح",
        description: "يمكنك تعبئة البيانات في القالب ثم استيرادها",
      });
    } catch (error) {
      console.error("Error generating template:", error);
      toast({
        title: "خطأ في تنزيل القالب",
        description: "حدث خطأ أثناء إنشاء القالب",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mb-6">
      <div 
        className={`excel-import-container ${isDragging ? 'border-primary bg-primary/5' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileInput}
          accept=".xlsx,.xls"
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <p className="text-lg font-medium">{placeholderText}</p>
          <p className="text-sm text-muted-foreground">
            تنسيقات مدعومة: .xlsx، .xls
          </p>
        </div>
      </div>
      
      <div className="flex justify-center">
        <Button
          variant="outline"
          className="flex items-center gap-2 mt-2"
          onClick={downloadTemplate}
        >
          <Download className="h-4 w-4" />
          <span>تنزيل قالب فارغ</span>
        </Button>
      </div>
    </div>
  );
};

export default ExcelImporter;