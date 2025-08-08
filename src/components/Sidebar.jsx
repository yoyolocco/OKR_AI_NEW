import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Target, 
  Building2, 
  CheckCircle, 
  Shield, 
  FileSpreadsheet, 
  Brain,
  ChevronDown,
  Rocket,
  Save,
  Download,
  Users,
  Trash2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/context/AppContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const { toast } = useToast();
  const { data, versions, saveVersion, deleteVersion, exportDataToXLSX, setActiveVersion } = useContext(AppContext);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Target, label: 'Şirket OKR\'ları', path: '/company-okrs' },
    { icon: Building2, label: 'Departman OKR\'ları', path: '/department-okrs' },
    { icon: CheckCircle, label: 'Check-in & Raporlar', path: '/check-in' },
    { icon: Users, label: 'Organizasyon Şeması', path: '/org-chart' },
    { icon: Shield, label: 'Yönetici Paneli', path: '/admin' },
    { icon: FileSpreadsheet, label: 'Excel Yükle', path: '/excel' },
    { icon: Brain, label: 'AI Analiz', path: '/ai-analysis' }
  ];
  
  const handleSaveVersion = () => {
    const versionName = `Versiyon ${versions.length + 1} - ${new Date().toLocaleDateString('tr-TR')}`;
    saveVersion(versionName);
  };
  
  const handleExportVersion = (version) => {
    exportDataToXLSX(version.data, version.name);
    toast({
      title: "Versiyon Dışa Aktarıldı! 📄",
      description: `"${version.name}" başarıyla indirildi.`,
    });
  }

  return (
    <motion.div 
      className={`fixed left-0 top-0 h-full bg-slate-900/95 backdrop-blur-lg border-r border-brand-cyan/20 transition-all duration-300 z-50 flex flex-col ${
        isOpen ? 'w-64' : 'w-16'
      }`}
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4 border-b border-brand-cyan/20">
        <div className="flex items-center space-x-3">
          <div className="rocket-animation">
            <Rocket className="w-8 h-8 text-brand-cyan" />
          </div>
          {isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <h1 className="text-xl font-bold text-white">OKR-AI</h1>
            </motion.div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="p-4 border-b border-brand-cyan/20">
          <Button 
            onClick={handleSaveVersion}
            className="w-full bg-brand-cyan text-brand-dark px-4 py-2 rounded-lg font-medium hover:bg-brand-cyan/90 transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Yeni Versiyon Kaydet</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full mt-3 flex items-center justify-between text-sm text-gray-300">
                <span>Versiyonlar ({versions.length})</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 text-white">
              <DropdownMenuItem onSelect={() => setActiveVersion('latest')} className="cursor-pointer hover:!bg-slate-700">
                Mevcut Durum (Canlı)
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              {versions.map((version) => (
                 <DropdownMenuItem key={version.id} onSelect={(e) => e.preventDefault()} className="cursor-pointer hover:!bg-slate-700 flex justify-between items-center">
                   <span onClick={() => setActiveVersion(version.name)}>{version.name}</span>
                   <div className="flex items-center space-x-2">
                     <Download className="w-4 h-4 hover:text-brand-cyan" onClick={() => handleExportVersion(version)} />
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Trash2 className="w-4 h-4 hover:text-red-500" />
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Versiyonu Silmek Üzeresiniz</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{version.name}" versiyonunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-slate-600 hover:bg-slate-700">İptal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteVersion(version.id)} className="bg-red-600 hover:bg-red-700">Sil</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                   </div>
                 </DropdownMenuItem>
              ))}
              {versions.length === 0 && <DropdownMenuItem disabled>Henüz versiyon yok.</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item flex items-center space-x-3 px-3 py-3 rounded-lg transition-all ${
                isActive ? 'active' : 'text-gray-300 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>
    </motion.div>
  );
};

export default Sidebar;