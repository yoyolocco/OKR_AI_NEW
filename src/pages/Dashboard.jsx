import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Users, Award, Rocket, Hourglass, Crown, Star, HeartPulse } from 'lucide-react';
import { AppContext } from '@/context/AppContext';

const Dashboard = () => {
  console.log("Dashboard component rendered"); // Added for debugging
  const { data } = useContext(AppContext);
  const { objectives, departments, healthMetrics } = data;

  const totalCompanyObjectives = objectives.length;
  const totalDepartmentObjectives = departments.reduce((sum, dept) => sum + (dept.objectives?.length || 0), 0);
  const totalActiveObjectives = totalCompanyObjectives + totalDepartmentObjectives;

  const overallCompanyProgress = totalCompanyObjectives > 0 
    ? Math.round(objectives.reduce((sum, obj) => sum + (obj.progress || 0), 0) / totalCompanyObjectives)
    : 0;

  const departmentCount = departments.length;

  const sortedDepartments = [...departments].sort((a, b) => (b.progress || 0) - (a.progress || 0));
  const topPerforming = sortedDepartments.slice(0, 1);
  const needsImprovement = sortedDepartments.slice(-1);

  const metrics = [
    { id: 1, label: 'Genel İlerleme', value: `${overallCompanyProgress}%`, Icon: TrendingUp },
    { id: 2, label: 'Aktif Hedefler', value: totalActiveObjectives, Icon: Target },
    { id: 3, label: 'Departman Sayısı', value: departmentCount, Icon: Users },
    { id: 4, label: 'Sağlık Metrikleri', value: healthMetrics.length, Icon: HeartPulse },
  ];

  // Calculate current quarter/month for Hourglass
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  const totalDaysInYear = (endOfYear - startOfYear) / (1000 * 60 * 60 * 24);
  const daysPassed = (now - startOfYear) / (1000 * 60 * 60 * 24);
  const yearProgress = (daysPassed / totalDaysInYear) * 100;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Şirket Hedeflerine Uçuş</h1>
        <div className="relative w-full max-w-md mx-auto h-4 bg-slate-700 rounded-full">
            <motion.div 
                className="absolute top-0 left-0 h-full bg-brand-cyan rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${overallCompanyProgress}%` }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            <div 
                className="absolute -top-5 w-12 h-12 flex items-center justify-center"
                style={{ left: `calc(${yearProgress}% - 1.5rem)` }}
                title={`Bugün: ${now.toLocaleDateString()}`}
            >
                <Hourglass className="w-8 h-8 text-white"/>
            </div>
            <motion.div 
                className="absolute -top-5 w-12 h-12 flex items-center justify-center"
                initial={{ left: '0%' }}
                animate={{ left: `calc(${overallCompanyProgress}% - 1.5rem)` }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            >
                <Rocket className="w-8 h-8 text-white transform -rotate-45"/>
            </motion.div>
        </div>
        <div className="mt-12 text-center">
          <span className="text-4xl font-bold text-brand-cyan">{overallCompanyProgress}%</span>
          <span className="text-gray-400 ml-2">Tamamlandı</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
            <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
                className="metric-card card-hover"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">{metric.label}</p>
                        <p className="text-2xl font-bold text-white mt-1">{metric.value}</p>
                    </div>
                    <metric.Icon className="w-8 h-8 text-brand-cyan" />
                </div>
            </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glassmorphism rounded-xl p-6"
      >
        <h2 className="text-xl font-bold text-white mb-6">Sağlık Metrikleri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(healthMetrics || []).map((metric) => (
            <div key={metric.id} className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">{metric.title}</span>
                </div>
                <span className="font-semibold text-brand-cyan-light">{metric.progress || 0}%</span>
              </div>
              <div className="text-xs text-gray-400">Sorumlu: {metric.responsible}</div>
            </div>
          ))}
          {(healthMetrics || []).length === 0 && (
            <p className="text-gray-400 col-span-full text-center">Sağlık metriği bulunmuyor.</p>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glassmorphism rounded-xl p-6"
      >
        <h2 className="text-xl font-bold text-white mb-6">Genel Durum Paneli</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {topPerforming.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2"><Crown className="w-5 h-5 text-yellow-500" /><span className="text-sm text-gray-400">En Başarılı Departman</span></div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg font-semibold text-brand-cyan">{topPerforming[0].name}</p>
                            <p className="text-sm text-gray-400">%{topPerforming[0].progress || 0} ilerleme</p>
                        </div>
                        <span className="text-2xl">🎉</span>
                    </div>
                </div>
            )}
            {needsImprovement.length > 0 && topPerforming[0]?.id !== needsImprovement[0]?.id && (
                 <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2"><Star className="w-5 h-5 text-red-500" /><span className="text-sm text-gray-400">Gelişim Alanı</span></div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg font-semibold text-brand-cyan">{needsImprovement[0].name}</p>
                            <p className="text-sm text-gray-400">%{needsImprovement[0].progress || 0} ilerleme</p>
                        </div>
                        <span className="text-2xl">📈</span>
                    </div>
                </div>
            )}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;