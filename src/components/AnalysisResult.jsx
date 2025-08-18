import React from 'react';
import { Brain } from 'lucide-react';

const AnalysisResult = ({ analysis }) => {
  if (!analysis || !analysis.title) {
    return (
        <div className="bg-slate-800/50 rounded-lg p-6 text-center">
            <Brain className="w-12 h-12 text-brand-cyan mx-auto mb-4" />
            <p className="text-gray-300 mb-2">Henüz analiz yapılmadı</p>
            <p className="text-gray-400 text-sm">
                Yukarıdaki chat alanından bir soru sorarak AI destekli analiz başlatabilirsiniz.
            </p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">{analysis.title}</h2>
      <p className="text-gray-300">{analysis.summary}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(analysis.departments || []).map((dept, index) => (
          <div key={index} className="glassmorphism rounded-xl p-6">
            <h3 className="text-xl font-bold text-brand-cyan mb-4">{dept.name}</h3>
            <ul className="space-y-2">
              {(dept.krs || []).map((kr, i) => (
                <li key={i} className="text-sm text-gray-300">{kr}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisResult;