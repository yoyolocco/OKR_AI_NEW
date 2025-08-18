import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Bell, User, Eye, Settings, ChevronDown, LogOut } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/context/AppContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';


const Header = () => {
  const { toast } = useToast();
  const { viewMode, setViewMode, activeQuarter, setActiveQuarter } = useContext(AppContext);
  const { user, signOut } = useAuth();

  const currentYear = new Date().getFullYear();
  const quarters = [
    { label: 'Tümü', value: 'Tümü' },
    { label: 'Q1', value: `${currentYear}Q1` },
    { label: 'Q2', value: `${currentYear}Q2` },
    { label: 'Q3', value: `${currentYear}Q3` },
    { label: 'Q4', value: `${currentYear}Q4` },
  ];

  const handleQuarterClick = (quarterValue, event) => {
    if (event.ctrlKey) {
        setActiveQuarter(prev => {
            if (prev.includes(quarterValue)) {
                return prev.filter(q => q !== quarterValue);
            } else {
                return [...prev, quarterValue];
            }
        });
    } else {
        setActiveQuarter([quarterValue]);
    }
  };

  const handleFeatureClick = (feature) => {
    let description = "Bu özellik henüz tam olarak uygulanmadı, ancak yakında gelecek! 🚀";
    if (feature === 'Bildirimler') {
        description = "Şu anda yeni bildiriminiz bulunmuyor.";
    } else if (feature === 'Ayarlar') {
        description = "Uygulama ayarları yakında burada olacak.";
    }

    toast({
      title: `"${feature}"`,
      description: description,
      duration: 3000,
    });
  };

  return (
    <motion.header 
      className="bg-slate-900/50 backdrop-blur-lg border-b border-brand-cyan/20 px-6 py-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {quarters.map((quarter) => (
            <button
              key={quarter.value}
              onClick={(e) => handleQuarterClick(quarter.value, e)}
              className={`quarter-tab px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeQuarter.includes(quarter.value) ? 'active' : ''
              }`}
            >
              {quarter.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2 bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white">
                <Eye className="w-4 h-4 text-brand-cyan" />
                <span>Görünüm: {viewMode}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
              <DropdownMenuItem onClick={() => setViewMode('Yönetici')} className="cursor-pointer hover:!bg-slate-700">Yönetici</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('Departman')} className="cursor-pointer hover:!bg-slate-700">Departman</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => handleFeatureClick('Bildirimler')}
              className="p-2 text-gray-400 hover:text-white transition-colors relative"
            >
              <Bell className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => handleFeatureClick('Ayarlar')}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-brand-cyan" />
                  <span className="text-sm font-medium">{user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
                <DropdownMenuItem onClick={() => handleFeatureClick('Profil')} className="cursor-pointer hover:!bg-slate-700">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer hover:!bg-slate-700 text-red-400 hover:!text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Çıkış Yap</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;