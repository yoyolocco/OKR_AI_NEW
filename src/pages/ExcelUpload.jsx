import React, { useState, useCallback, useContext } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, Brain, Layers, Replace } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useDropzone } from 'react-dropzone';
import { AppContext } from '@/context/AppContext';
import * as XLSX from 'xlsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const ExcelUpload = () => {
  const { toast } = useToast();
  const { data, exportDataToXLSX, importDataFromXLSX, setData } = useContext(AppContext);
  const [uploadedData, setUploadedData] = useState(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showOrgChartImportDialog, setShowOrgChartImportDialog] = useState(false);
  const [uploadedOrgChartData, setUploadedOrgChartData] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const parsedData = XLSX.utils.sheet_to_json(ws);
        setUploadedData(parsedData);
        setShowImportDialog(true);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Excel Okuma Hatası',
          description: 'Dosya okunurken bir hata oluştu. Lütfen dosya formatını kontrol edin.',
        });
      }
    };
    reader.readAsBinaryString(file);
  }, [toast]);

  const onOrgChartDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const parsedData = XLSX.utils.sheet_to_json(ws);
        setUploadedOrgChartData(parsedData);
        setShowOrgChartImportDialog(true);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Excel Okuma Hatası',
          description: 'Dosya okunurken bir hata oluştu. Lütfen dosya formatını kontrol edin.',
        });
      }
    };
    reader.readAsBinaryString(file);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] }, multiple: false });
  const { getRootProps: getOrgChartRootProps, getInputProps: getOrgChartInputProps, isDragActive: isOrgChartDragActive } = useDropzone({ onDrop: onOrgChartDrop, accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] }, multiple: false });

  const handleDownloadTemplate = () => {
    const templateData = [
      { "Hedef Tipi": "Şirket", "Departman Adı": "", "Şirket Hedefi": "Örnek Şirket Hedefi", "Departman Hedefi": "", "KR Açıklaması": "Örnek KR 1", "Sorumlu": "Ali Veli", "KR Tipi": "artan", "Ağırlık": 50, "Başlangıç Değeri": "", "İlerleme (%)": 25, "Aksiyon": "Haftalık toplantı", "Hedef_2025Q1": 100, "Gerçekleşen_2025Q1": 25 },
      { "Hedef Tipi": "Departman", "Departman Adı": "DF Fit", "Şirket Hedefi": "Örnek Şirket Hedefi", "Departman Hedefi": "Örnek Departman Hedefi", "KR Açıklaması": "Örnek KR 2", "Sorumlu": "Ayşe Yılmaz", "KR Tipi": "azalan", "Ağırlık": 100, "Başlangıç Değeri": 10, "İlerleme (%)": 0, "Aksiyon": "Rapor hazırlama", "Hedef_2025Q1": 5, "Gerçekleşen_2025Q1": 8 }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "OKR Şablonu");
    XLSX.writeFile(wb, "OKR_Sablonu.xlsx");
    toast({
      title: "Şablon İndirildi!",
      description: "Excel şablonu başarıyla indirildi.",
    });
  };

  const handleDownloadOrgChartTemplate = () => {
    const templateData = [
      { "Name": "DeFacto CEO", "Parent": "" },
      { "Name": "CTO", "Parent": "DeFacto CEO" },
      { "Name": "DF Fit", "Parent": "CTO" },
      { "Name": "Dijital Pazarlama", "Parent": "CTO" },
      { "Name": "CFO", "Parent": "DeFacto CEO" },
      { "Name": "Finans", "Parent": "CFO" },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Organizasyon Şeması Şablonu");
    XLSX.writeFile(wb, "Organizasyon_Semasi_Sablonu.xlsx");
    toast({
      title: "Şablon İndirildi!",
      description: "Organizasyon şeması şablonu başarıyla indirildi.",
    });
  };

  const handleImportConfirm = (mode) => {
    if (uploadedData) {
      importDataFromXLSX(uploadedData, mode);
    }
    setShowImportDialog(false);
    setUploadedData(null);
  };

  const handleOrgChartImportConfirm = () => {
    if (uploadedOrgChartData) {
      const newOrgChart = {};
      const nodes = {};

      // Create nodes and map them by name
      uploadedOrgChartData.forEach(row => {
        nodes[row.Name] = { name: row.Name, children: [] };
      });

      // Build the tree
      uploadedOrgChartData.forEach(row => {
        if (row.Parent && nodes[row.Parent]) {
          nodes[row.Parent].children.push(nodes[row.Name]);
        } else if (!row.Parent) {
          // This is a root node
          newOrgChart.name = row.Name;
          newOrgChart.children = nodes[row.Name].children; // Assign children of the root node
        }
      });
      
      // If there's no explicit root in the Excel, find one (e.g., the one with no parent)
      if (!newOrgChart.name && uploadedOrgChartData.length > 0) {
        const rootNode = uploadedOrgChartData.find(row => !row.Parent);
        if (rootNode) {
          newOrgChart.name = rootNode.Name;
          newOrgChart.children = nodes[rootNode.Name].children;
        } else { // Fallback if no explicit root, just take the first one as root
          newOrgChart.name = uploadedOrgChartData[0].Name;
          newOrgChart.children = nodes[uploadedOrgChartData[0].Name].children;
        }
      }

      setData(prev => ({ ...prev, orgChart: newOrgChart }));
      toast({ title: "Organizasyon Şeması Yüklendi!", description: "Organizasyon şeması başarıyla güncellendi." });
    }
    setShowOrgChartImportDialog(false);
    setUploadedOrgChartData(null);
  };
  
  return (
    <>
      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excel Verisini İçe Aktar</AlertDialogTitle>
            <AlertDialogDescription>
              Yüklediğiniz Excel verisini mevcut OKR verilerinizle nasıl birleştirmek istersiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 hover:bg-slate-700">İptal</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleImportConfirm('merge')} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"><Layers className="w-4 h-4" /> Birleştir</AlertDialogAction>
            <AlertDialogAction onClick={() => handleImportConfirm('overwrite')} className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2"><Replace className="w-4 h-4" /> Üzerine Yaz</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showOrgChartImportDialog} onOpenChange={setShowOrgChartImportDialog}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Organizasyon Şeması İçe Aktar</AlertDialogTitle>
            <AlertDialogDescription>
              Yüklediğiniz Excel dosyasındaki organizasyon şemasını mevcut şema ile değiştirmek istediğinizden emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 hover:bg-slate-700">İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleOrgChartImportConfirm} className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2"><Replace className="w-4 h-4" /> Üzerine Yaz</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center space-x-3">
          <FileSpreadsheet className="w-8 h-8 text-green-500" />
          <h1 className="text-3xl font-bold text-white">Excel Veri Yönetimi</h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="glassmorphism rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">I. OKR Verisi Yükle (Excel)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div {...getRootProps()} className={`excel-upload-zone p-8 text-center transition-all cursor-pointer ${isDragActive ? 'border-brand-cyan bg-brand-cyan/10' : ''}`}>
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-brand-cyan mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{isDragActive ? "Dosyayı buraya bırakın..." : "Dosyaları sürükleyin veya tıklayın"}</h3>
                <p className="text-gray-400 mb-4">Excel formatında OKR verilerinizi yükleyin.</p>
                <Button className="mt-4 bg-slate-600 hover:bg-slate-500 text-white pointer-events-none">Dosya Seç</Button>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-white">Yükleme Talimatları</h4>
                <p className="text-gray-400 text-sm">Excel dosyanızı yükledikten sonra "Birleştir" veya "Üzerine Yaz" seçeneği ile verilerinizi içe aktarabilirsiniz.</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2"><AlertCircle className="w-4 h-4 text-yellow-500" /><span className="text-sm text-gray-400">"Üzerine Yaz" tüm veriyi siler.</span></div>
                  <div className="flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-sm text-gray-400">"Birleştir" mevcut veriye ekler.</span></div>
                </div>
              </div>
            </div>
          </div>
          <div className="glassmorphism rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">II. Organizasyon Şeması Yükle (Excel)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div {...getOrgChartRootProps()} className={`excel-upload-zone p-8 text-center transition-all cursor-pointer ${isOrgChartDragActive ? 'border-brand-cyan bg-brand-cyan/10' : ''}`}>
                <input {...getOrgChartInputProps()} />
                <Upload className="w-12 h-12 text-brand-cyan mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{isOrgChartDragActive ? "Dosyayı buraya bırakın..." : "Dosyaları sürükleyin veya tıklayın"}</h3>
                <p className="text-gray-400 mb-4">Excel formatında organizasyon şeması verilerinizi yükleyin.</p>
                <Button className="mt-4 bg-slate-600 hover:bg-slate-500 text-white pointer-events-none">Dosya Seç</Button>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-white">Yükleme Talimatları</h4>
                <p className="text-gray-400 text-sm">Organizasyon şeması Excel dosyanızı yükledikten sonra mevcut şemayı güncelleyebilirsiniz.</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2"><AlertCircle className="w-4 h-4 text-yellow-500" /><span className="text-sm text-gray-400">Yüklenen şema mevcut şemanın üzerine yazılacaktır.</span></div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glassmorphism rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">III. Veri Aktar</h2>
              <p className="text-gray-400 mb-4">Mevcut tüm OKR verilerinizi XLSX formatında dışa aktarın.</p>
              <Button onClick={() => exportDataToXLSX(data, 'Mevcut_OKR_Verileri')} className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark"><Download className="w-4 h-4 mr-2" />Tüm Veriyi İndir</Button>
            </div>
            <div className="glassmorphism rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">IV. Şablon İndir</h2>
              <p className="text-gray-400 mb-4">Veri yüklemek için örnek Excel şablonunu indirin.</p>
              <Button onClick={handleDownloadTemplate} variant="outline" className="w-full border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10"><Download className="w-4 h-4 mr-2" />OKR Şablonu İndir</Button>
              <Button onClick={handleDownloadOrgChartTemplate} variant="outline" className="w-full border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10 mt-2"><Download className="w-4 h-4 mr-2" />Organizasyon Şeması Şablonu İndir</Button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default ExcelUpload;