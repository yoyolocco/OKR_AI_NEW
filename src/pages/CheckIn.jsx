import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Plus, ChevronDown, ChevronUp, Save, Trash2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
} from "@/components/ui/alert-dialog";

const CheckIn = () => {
  const { toast } = useToast();
  const { data, setData } = useContext(AppContext);
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [expandedObjectives, setExpandedObjectives] = useState([]);
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [selectedPeriodType, setSelectedPeriodType] = useState('quarter'); // 'quarter' or 'month'
  const [checkInValues, setCheckInValues] = useState({}); // { [krId]: { [period]: { target: '', actual: '' } } }

  const handleDeptSelect = (deptId) => {
    setSelectedDeptId(deptId);
    const dept = data.departments.find(d => d.id === deptId);
    if (dept && dept.objectives) {
        setExpandedObjectives(dept.objectives.map(o => o.id));
    }
  };

  const toggleObjective = (objId) => {
    setExpandedObjectives(prev => 
      prev.includes(objId) ? prev.filter(id => id !== objId) : [...prev, objId]
    );
  };

  const generatePeriods = (year, type) => {
    const periods = [];
    if (type === 'quarter') {
      for (let q = 1; q <= 4; q++) periods.push(`${year}Q${q}`);
    } else { // month
      for (let m = 1; m <= 12; m++) periods.push(`${year}${m.toString().padStart(2, '0')}`);
    }
    return periods;
  };

  const periods = generatePeriods(selectedYear, selectedPeriodType);

  const handleCheckInValueChange = (krId, period, field, value) => {
    setCheckInValues(prev => ({
        ...prev,
        [krId]: {
            ...prev[krId],
            [period]: {
                ...prev[krId]?.[period],
                [field]: value
            }
        }
    }));
  };

  const handleSaveCheckIn = (deptId, objId, krId, period) => {
    const currentValues = checkInValues[krId]?.[period];
    if (!currentValues || !currentValues.target || !currentValues.actual) {
        toast({ variant: 'destructive', title: 'Eksik Bilgi', description: 'Lütfen hedef ve gerçekleşen değerlerini girin.' });
        return;
    }

    setData(prevData => {
        const newData = JSON.parse(JSON.stringify(prevData));
        const department = newData.departments.find(d => d.id === deptId);
        const objective = department.objectives.find(o => o.id === objId);
        const kr = objective.krs.find(k => k.id === krId);

        if (kr) {
            if (!kr.checkIns) kr.checkIns = [];
            
            const existingCheckInIndex = kr.checkIns.findIndex(ci => ci.period === period);

            if (existingCheckInIndex > -1) {
                kr.checkIns[existingCheckInIndex] = {
                    ...kr.checkIns[existingCheckInIndex],
                    target: currentValues.target,
                    actual: currentValues.actual,
                };
            } else {
                kr.checkIns.push({
                    period: period,
                    target: currentValues.target,
                    actual: currentValues.actual,
                });
            }
            // Update startValue for azalan type if it's the first check-in or explicitly set
            if (kr.type === 'azalan' && !kr.startValue && kr.checkIns.length === 1) {
                kr.startValue = currentValues.actual; // Initial actual value as startValue
            }
        }
        return newData;
    });

    toast({ title: 'Check-in Kaydedildi!', description: `"${period}" dönemi için ilerleme güncellendi.` });
  };

  const renderCheckInRow = (deptId, objId, kr, period) => {
    const checkIn = kr.checkIns?.find(ci => ci.period === period);
    const currentValues = checkInValues[kr.id]?.[period] || {};

    useEffect(() => {
        if (checkIn) {
            setCheckInValues(prev => ({
                ...prev,
                [kr.id]: {
                    ...prev[kr.id],
                    [period]: {
                        target: checkIn.target,
                        actual: checkIn.actual
                    }
                }
            }));
        }
    }, [checkIn, kr.id, period]);

    return (
        <div key={period} className="grid grid-cols-4 gap-2 items-center text-sm">
            <div className="font-medium text-white">{period}</div>
            <Input 
                type="number" 
                value={currentValues.target || ''} 
                onChange={e => handleCheckInValueChange(kr.id, period, 'target', e.target.value)}
                placeholder="Hedef"
                className="bg-slate-700"
            />
            <Input 
                type="number" 
                value={currentValues.actual || ''} 
                onChange={e => handleCheckInValueChange(kr.id, period, 'actual', e.target.value)}
                placeholder="Gerçekleşen"
                className="bg-slate-700"
            />
            <Button size="sm" onClick={() => handleSaveCheckIn(deptId, objId, kr.id, period)} className="w-full">
                <Save className="w-3 h-3 mr-1"/> Kaydet
            </Button>
        </div>
    );
  };

  const selectedDepartment = data.departments.find(d => d.id === selectedDeptId);

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Check-in</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {data.departments.map(dept => (
                <div key={dept.id} onClick={() => handleDeptSelect(dept.id)} className={`p-4 rounded-lg cursor-pointer transition-all ${selectedDeptId === dept.id ? 'bg-brand-cyan text-brand-dark' : 'bg-slate-800/50 hover:bg-slate-800/80'}`}>
                    <h3 className="font-bold">{dept.name}</h3>
                    <p className="text-sm">{dept.progress || 0}% tamamlandı</p>
                </div>
            ))}
        </div>

        {selectedDepartment && (
            <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} className="space-y-4">
                <h2 className="text-2xl font-bold text-white mt-6">{selectedDepartment.name} - Hedefler</h2>

                <div className="flex space-x-4 mb-4">
                    <Select onValueChange={setSelectedYear} value={selectedYear}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Yıl Seçin" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={String(new Date().getFullYear())}>{new Date().getFullYear()}</SelectItem>
                            <SelectItem value={String(new Date().getFullYear() + 1)}>{new Date().getFullYear() + 1}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select onValueChange={setSelectedPeriodType} value={selectedPeriodType}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Dönem Tipi" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="quarter">Çeyrek</SelectItem>
                            <SelectItem value="month">Ay</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {(selectedDepartment.objectives || []).map(obj => (
                    <div key={obj.id} className="glassmorphism rounded-xl overflow-hidden">
                        <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => toggleObjective(obj.id)}>
                            <h3 className="font-bold text-white">{obj.title}</h3>
                            <div className="flex items-center space-x-4">
                                <span className="font-bold text-brand-cyan">{obj.progress || 0}%</span>
                                {expandedObjectives.includes(obj.id) ? <ChevronUp/> : <ChevronDown/>}
                            </div>
                        </div>
                        {expandedObjectives.includes(obj.id) && (
                            <motion.div initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}} className="border-t border-brand-cyan/20 p-4 space-y-3">
                                {(obj.krs || []).map(kr => (
                                    <div key={kr.id} className="p-3 bg-slate-800/50 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <p>{kr.title} <span className="text-xs text-gray-400">(Ağırlık: {kr.weight}%)</span></p>
                                            <p className="font-semibold text-brand-cyan-light">{kr.progress || 0}%</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-4 gap-2 font-bold text-gray-400 text-sm border-b pb-1">
                                                <div>Dönem</div>
                                                <div>Hedef</div>
                                                <div>Gerçekleşen</div>
                                                <div></div>
                                            </div>
                                            {periods.map(period => renderCheckInRow(selectedDeptId, obj.id, kr, period))}
                                        </div>
                                    </div>
                                ))}
                                {(!obj.krs || obj.krs.length === 0) && <p className="text-center text-gray-500 py-4">Bu hedefe bağlı KR bulunmuyor.</p>}
                            </motion.div>
                        )}
                    </div>
                ))}
                 {(!selectedDepartment.objectives || selectedDepartment.objectives.length === 0) && <p className="text-center text-gray-400 py-8">Bu departman için hedef tanımlanmamış.</p>}
            </motion.div>
        )}
    </div>
  );
};

export default CheckIn;