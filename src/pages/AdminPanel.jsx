import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/context/AppContext';

const AdminPanel = () => {
  const { toast } = useToast();
  const { data } = useContext(AppContext);

  const totalObjectives = data.objectives.length + data.departments.reduce((sum, dept) => sum + dept.objectives.length, 0);
  const totalKRs = data.objectives.reduce((sum, obj) => sum + (obj.krs?.length || 0), 0) +
                   data.departments.reduce((sum, dept) => sum + dept.objectives.reduce((s, o) => s + (o.krs?.length || 0), 0), 0);
  
  const completedKRs = data.objectives.reduce((sum, obj) => sum + (obj.krs?.filter(kr => kr.progress >= 100).length || 0), 0) +
                       data.departments.reduce((sum, dept) => sum + dept.objectives.reduce((s, o) => s + (o.krs?.filter(kr => kr.progress >= 100).length || 0), 0), 0);
  
  const getDepartmentStats = (deptName) => {
    const dept = data.departments.find(d => d.name === deptName);
    if (!dept || !dept.objectives || dept.objectives.length === 0) return { performance: 0, completion: 0, emoji: '🤔' };

    let totalProgress = 0;
    let krCount = 0;
    
    dept.objectives.forEach(obj => {
        (obj.krs || []).forEach(kr => {
            totalProgress += kr.progress;
            krCount++;
        });
    });

    const completion = krCount > 0 ? Math.round(totalProgress / krCount) : 0;
    const performance = completion; // Simplified for now
    let emoji = '🤔';
    if (performance > 75) emoji = '🚀';
    else if (performance > 50) emoji = '😊';
    else if (performance > 25) emoji = '⏳';
    else if (performance > 0) emoji = '❗';

    return { performance, completion, emoji };
  };

  const departments = [
    { name: 'DF Fit' }, { name: 'Dijital Pazarlama' }, { name: 'Franchise' }, 
    { name: 'DSO' }, { name: 'Expansion' }, { name: 'Satın Alma' }, { name: 'Kids & Baby' }
  ].map(d => ({ ...d, ...getDepartmentStats(d.name) }));

  const handleFeatureClick = (feature) => {
    toast({
      title: "🚧 Bu özellik henüz uygulanmadı—ama merak etmeyin! Bir sonraki istekte talep edebilirsiniz! 🚀",
      duration: 3000,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-3"
      >
        <Shield className="w-8 h-8 text-brand-cyan" />
        <h1 className="text-3xl font-bold text-white">Yönetici Paneli</h1>
      </motion.div>

      {/* Department Performance Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glassmorphism rounded-xl p-6"
      >
        <h2 className="text-xl font-bold text-white mb-6">Departman Performans Özeti</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-cyan/20">
                <th className="text-left py-3 text-gray-400 font-medium">Departman</th>
                <th className="text-center py-3 text-gray-400 font-medium">Performans</th>
                <th className="text-center py-3 text-gray-400 font-medium">Tamamlanma Oranı</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, index) => (
                <motion.tr
                  key={dept.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-white font-medium">{dept.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="department-performance-bar w-24">
                        <div 
                          className="performance-fill" 
                          style={{ width: `${dept.performance}%` }}
                        ></div>
                      </div>
                      <span className="text-2xl">{dept.emoji}</span>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <span className="text-xl font-bold text-white">{dept.completion}%</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="metric-card card-hover cursor-pointer"
          onClick={() => handleFeatureClick('manage-users')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Kullanıcı Yönetimi</p>
              <p className="text-lg font-bold text-white mt-1">Yetkileri Düzenle</p>
            </div>
            <Users className="w-8 h-8 text-brand-cyan" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="metric-card card-hover cursor-pointer"
          onClick={() => handleFeatureClick('system-reports')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Sistem Raporları</p>
              <p className="text-lg font-bold text-white mt-1">Detaylı Analiz</p>
            </div>
            <TrendingUp className="w-8 h-8 text-brand-cyan" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="metric-card card-hover cursor-pointer"
          onClick={() => handleFeatureClick('system-alerts')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Sistem Uyarıları</p>
              <p className="text-lg font-bold text-white mt-1">0 Aktif Uyarı</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </motion.div>
      </div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glassmorphism rounded-xl p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4">Sistem Durumu</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Toplam Hedefler</span>
              <span className="text-white font-bold">{totalObjectives}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Toplam KR'lar</span>
              <span className="text-white font-bold">{totalKRs}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Tamamlanan KR'lar</span>
              <span className="text-white font-bold">{completedKRs}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Sistem Sağlığı</span>
              <span className="text-green-500 font-bold">Mükemmel</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Son Güncelleme</span>
              <span className="text-white font-bold">Şimdi</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Veri Senkronizasyonu</span>
              <span className="text-green-500 font-bold">Aktif</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminPanel;