import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Users, User, Briefcase } from 'lucide-react';
import { AppContext } from '@/context/AppContext';

const OrgChartNode = ({ node, level = 0 }) => {
  const isRoot = level === 0;
  const isDepartment = level === 1;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      className={`relative pl-8 ${!isRoot ? 'pt-4' : ''}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      {!isRoot && (
        <div className="absolute left-2 top-0 h-full w-px bg-brand-cyan/20"></div>
      )}
      {!isRoot && (
        <div className="absolute left-2 top-8 h-px w-6 bg-brand-cyan/20"></div>
      )}
      <motion.div
        className="org-chart-node relative"
        variants={itemVariants}
      >
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isRoot ? 'bg-brand-cyan' : 'bg-brand-cyan/20'}`}>
            {isRoot ? <Briefcase className="w-6 h-6 text-brand-dark" /> : <User className="w-6 h-6 text-brand-cyan" />}
          </div>
          <div>
            <h3 className={`font-bold ${isRoot ? 'text-xl text-white' : 'text-lg text-brand-cyan-light'}`}>
              {node.name}
            </h3>
            {isDepartment && (
              <p className="text-sm text-gray-400">Departman</p>
            )}
          </div>
        </div>
      </motion.div>
      {node.children && node.children.length > 0 && (
        <div className="mt-4 space-y-4">
          {node.children.map((child, index) => (
            <OrgChartNode key={index} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

const OrgChart = () => {
  const { data } = useContext(AppContext);
  
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-3"
      >
        <Users className="w-8 h-8 text-brand-cyan" />
        <h1 className="text-3xl font-bold text-white">Organizasyon Şeması</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glassmorphism rounded-xl p-6"
      >
        <OrgChartNode node={data.orgChart} />
      </motion.div>
    </div>
  );
};

export default OrgChart;