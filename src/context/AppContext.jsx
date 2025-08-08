import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';

export const AppContext = createContext();

const initialData = {
  objectives: [],
  departments: [],
  orgChart: {},
};

// --- Progress Calculation Logic ---
const calculateKrProgress = (kr) => {
  if (!kr.checkIns || kr.checkIns.length === 0) return 0;
  const lastCheckIn = kr.checkIns[kr.checkIns.length - 1];
  const target = parseFloat(lastCheckIn.target);
  const actual = parseFloat(lastCheckIn.actual);
  const startValue = parseFloat(kr.startValue) || 0;

  if (isNaN(target) || isNaN(actual)) return 0;

  if (kr.type === 'azalan') {
    if (target >= startValue) return 100;
    const progress = ((startValue - actual) / (startValue - target)) * 100;
    return Math.max(0, Math.min(progress, 100));
  } else {
    if (target === 0) return actual > 0 ? 100 : 0;
    const progress = (actual / target) * 100;
    return Math.max(0, Math.min(progress, 100));
  }
};

const calculateObjectiveProgress = (objective) => {
  if (!objective.krs || objective.krs.length === 0) return 0;
  const totalWeight = objective.krs.reduce((sum, kr) => sum + (kr.weight || 0), 0);
  if (totalWeight === 0) return 0;

  const weightedProgress = objective.krs.reduce((sum, kr) => sum + (kr.progress * (kr.weight || 0)), 0);
  return Math.round(weightedProgress / totalWeight);
};

const calculateOverallProgress = (data) => {
    const newData = JSON.parse(JSON.stringify(data));

    // 1. Calculate KR and then Department Objective progress
    newData.departments.forEach(dept => {
        (dept.objectives || []).forEach(obj => {
            (obj.krs || []).forEach(kr => {
                kr.progress = calculateKrProgress(kr);
            });
            obj.progress = calculateObjectiveProgress(obj);
        });
    });

    // 2. Calculate Company Objective progress based on linked Department Objectives
    newData.objectives.forEach(compObj => {
        const linkedDeptObjectives = [];
        newData.departments.forEach(dept => {
            (dept.objectives || []).forEach(deptObj => {
                if (deptObj.companyObjectiveId === compObj.id) {
                    linkedDeptObjectives.push(deptObj);
                }
            });
        });

        if (linkedDeptObjectives.length > 0) {
            const totalProgress = linkedDeptObjectives.reduce((sum, deptObj) => sum + deptObj.progress, 0);
            compObj.progress = Math.round(totalProgress / linkedDeptObjectives.length);
        } else {
            compObj.progress = 0; // Or calculate based on its own KRs if any
        }
    });
    
    // 3. Calculate overall progress for each department
    newData.departments.forEach(dept => {
        if (!dept.objectives || dept.objectives.length === 0) {
            dept.progress = 0;
        } else {
            const totalProgress = dept.objectives.reduce((sum, obj) => sum + obj.progress, 0);
            dept.progress = Math.round(totalProgress / dept.objectives.length);
        }
    });

    return newData;
};

export const AppContextProvider = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState(initialData);
  const [versions, setVersions] = useState([]);
  const [activeVersion, setActiveVersion] = useState('latest');
  const [viewMode, setViewMode] = useState('Yönetici');
  const [activeQuarter, setActiveQuarter] = useState('Tümü');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    const { data: okrData, error: okrError } = await supabase
      .from('okr_data')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (okrError) {
      toast({ variant: "destructive", title: "Veri alınamadı", description: okrError.message });
    } else if (okrData && okrData.length > 0) {
      const calculatedData = calculateOverallProgress({
        objectives: okrData[0].objectives || [],
        departments: okrData[0].departments || [],
        orgChart: okrData[0].org_chart || initialData.orgChart,
      });
      setData(calculatedData);
    } else {
      setData(initialData);
    }

    const { data: versionData, error: versionError } = await supabase
      .from('okr_versions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (versionError) {
      toast({ variant: "destructive", title: "Versiyonlar alınamadı", description: versionError.message });
    } else {
      setVersions(versionData || []);
    }
    
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateSupabaseData = useCallback(async (newData) => {
    if (!user) return;
    const { data: existingData, error: fetchError } = await supabase
      .from('okr_data')
      .select('id')
      .eq('user_id', user.id);

    if (fetchError) {
      toast({ variant: "destructive", title: "Veri güncellenemedi", description: fetchError.message });
      return;
    }

    const updatePayload = {
      user_id: user.id,
      objectives: newData.objectives,
      departments: newData.departments,
      org_chart: newData.orgChart,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (existingData && existingData.length > 0) {
      const { error: updateError } = await supabase
        .from('okr_data')
        .update(updatePayload)
        .eq('id', existingData[0].id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('okr_data')
        .insert(updatePayload);
      error = insertError;
    }

    if (error) {
      toast({ variant: "destructive", title: "Veri kaydedilemedi", description: error.message });
    }
  }, [user, toast]);

  const handleSetData = (newData) => {
    const updatedData = typeof newData === 'function' ? newData(data) : newData;
    const calculatedData = calculateOverallProgress(updatedData);
    setData(calculatedData);
    if (activeVersion === 'latest') {
      updateSupabaseData(calculatedData);
    }
  };

  const saveVersion = async (name) => {
    if (!user) return;
    const newVersion = { 
      user_id: user.id,
      name,
      data: {
        objectives: data.objectives,
        departments: data.departments,
        orgChart: data.orgChart,
      }
    };
    const { data: insertedVersion, error } = await supabase
      .from('okr_versions')
      .insert(newVersion)
      .select();

    if (error) {
      toast({ variant: "destructive", title: "Versiyon kaydedilemedi", description: error.message });
    } else {
      setVersions(prev => [insertedVersion[0], ...prev]);
      toast({ title: "Versiyon başarıyla kaydedildi!", description: `"${name}" oluşturuldu.` });
    }
  };

  const deleteVersion = async (versionId) => {
    if (!user) return;
    const { error } = await supabase
      .from('okr_versions')
      .delete()
      .eq('id', versionId);
    
    if (error) {
      toast({ variant: "destructive", title: "Versiyon silinemedi", description: error.message });
    } else {
      setVersions(prev => prev.filter(v => v.id !== versionId));
      toast({ title: "Versiyon silindi." });
    }
  };

  const exportDataToXLSX = (dataToExport, fileName) => {
    const allOKRData = [];
    const allPeriods = new Set();

    // Generate all possible periods for the current and next year
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year <= currentYear + 1; year++) {
        for (let q = 1; q <= 4; q++) {
            allPeriods.add(`${year}Q${q}`);
        }
        for (let m = 1; m <= 12; m++) {
            allPeriods.add(`${year}${m.toString().padStart(2, '0')}`);
        }
    }
    const sortedPeriods = Array.from(allPeriods).sort();

    // Process Company Objectives and their KRs
    dataToExport.objectives.forEach(compObj => {
        (compObj.krs || []).forEach(kr => {
            const row = {
                'Hedef Tipi': 'Şirket',
                'Departman Adı': '',
                'Şirket Hedefi': compObj.title,
                'Departman Hedefi': '',
                'KR Açıklaması': kr.title,
                'Sorumlu': kr.responsible,
                'KR Tipi': kr.type,
                'Ağırlık': kr.weight,
                'Başlangıç Değeri': kr.startValue,
                'İlerleme (%)': kr.progress,
                'Aksiyon': kr.action,
            };
            sortedPeriods.forEach(period => {
                const checkIn = kr.checkIns?.find(ci => ci.period === period);
                row[`Hedef_${period}`] = checkIn ? checkIn.target : '';
                row[`Gerçekleşen_${period}`] = checkIn ? checkIn.actual : '';
            });
            allOKRData.push(row);
        });
    });

    // Process Department Objectives and their KRs
    dataToExport.departments.forEach(dept => {
        (dept.objectives || []).forEach(deptObj => {
            const companyObjective = dataToExport.objectives.find(co => co.id === deptObj.companyObjectiveId);
            (deptObj.krs || []).forEach(kr => {
                const row = {
                    'Hedef Tipi': 'Departman',
                    'Departman Adı': dept.name,
                    'Şirket Hedefi': companyObjective ? companyObjective.title : 'İlişkilendirilmemiş',
                    'Departman Hedefi': deptObj.title,
                    'KR Açıklaması': kr.title,
                    'Sorumlu': kr.responsible,
                    'KR Tipi': kr.type,
                    'Ağırlık': kr.weight,
                    'Başlangıç Değeri': kr.startValue,
                    'İlerleme (%)': kr.progress,
                    'Aksiyon': kr.action,
                };
                sortedPeriods.forEach(period => {
                    const checkIn = kr.checkIns?.find(ci => ci.period === period);
                    row[`Hedef_${period}`] = checkIn ? checkIn.target : '';
                    row[`Gerçekleşen_${period}`] = checkIn ? checkIn.actual : '';
                });
                allOKRData.push(row);
            });
        });
    });

    if (allOKRData.length === 0) {
        toast({ variant: "destructive", title: "Dışa Aktarılacak Veri Yok", description: "Lütfen önce OKR oluşturun." });
        return;
    }

    const ws = XLSX.utils.json_to_sheet(allOKRData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "OKR Verileri");
    XLSX.writeFile(wb, `${fileName || 'OKR_Verileri'}.xlsx`);
    toast({ title: "Veriler dışa aktarıldı!", description: `"${fileName || 'OKR_Verileri'}.xlsx" dosyası indirildi.` });
  };

  const importDataFromXLSX = (parsedData, mode) => {
    const newObjectives = JSON.parse(JSON.stringify(data.objectives));
    const newDepartments = JSON.parse(JSON.stringify(data.departments));

    parsedData.forEach(row => {
        const krData = {};
        const checkIns = [];
        let krId = null;

        // Extract base KR data
        krData.title = row['KR Açıklaması'];
        krData.responsible = row['Sorumlu'];
        krData.type = row['KR Tipi'];
        krData.weight = parseFloat(row['Ağırlık']);
        krData.startValue = parseFloat(row['Başlangıç Değeri']);
        krData.action = row['Aksiyon'];

        // Extract check-ins dynamically
        for (const key in row) {
            if (key.startsWith('Hedef_')) {
                const period = key.replace('Hedef_', '');
                const target = parseFloat(row[key]);
                const actual = parseFloat(row[`Gerçekleşen_${period}`]);
                if (!isNaN(target) && !isNaN(actual)) {
                    checkIns.push({ period, target, actual });
                }
            }
        }
        krData.checkIns = checkIns.sort((a, b) => a.period.localeCompare(b.period)); // Sort check-ins by period

        // Find or create KR and link to Objective/Department Objective
        if (row['Hedef Tipi'] === 'Şirket') {
            let compObj = newObjectives.find(o => o.title === row['Şirket Hedefi']);
            if (!compObj) {
                compObj = { id: Date.now() + Math.random(), title: row['Şirket Hedefi'], krs: [], progress: 0 };
                newObjectives.push(compObj);
            }
            const existingKr = compObj.krs.find(k => k.title === krData.title && k.responsible === krData.responsible);
            if (existingKr) {
                Object.assign(existingKr, { ...krData, id: existingKr.id });
            } else {
                compObj.krs.push({ ...krData, id: Date.now() + Math.random() });
            }
        } else if (row['Hedef Tipi'] === 'Departman') {
            let dept = newDepartments.find(d => d.name === row['Departman Adı']);
            if (!dept) {
                dept = { id: Date.now() + Math.random(), name: row['Departman Adı'], objectives: [], progress: 0 };
                newDepartments.push(dept);
            }
            let deptObj = dept.objectives.find(o => o.title === row['Departman Hedefi']);
            if (!deptObj) {
                deptObj = { id: Date.now() + Math.random(), title: row['Departman Hedefi'], krs: [], progress: 0, companyObjectiveId: data.objectives.find(co => co.title === row['Şirket Hedefi'])?.id };
                dept.objectives.push(deptObj);
            }
            const existingKr = deptObj.krs.find(k => k.title === krData.title && k.responsible === krData.responsible);
            if (existingKr) {
                Object.assign(existingKr, { ...krData, id: existingKr.id });
            } else {
                deptObj.krs.push({ ...krData, id: Date.now() + Math.random() });
            }
        }
    });

    if (mode === 'overwrite') {
        setData(calculateOverallProgress({ objectives: newObjectives, departments: newDepartments, orgChart: data.orgChart }));
        toast({ title: "Başarılı!", description: "Veriler Excel'den başarıyla üzerine yazıldı." });
    } else { // merge
        // Merge logic needs to be more sophisticated for deep merging KRs and objectives
        toast({ title: "Birleştirme özelliği güncelleniyor", description: "Veri birleştirme özelliği henüz bu format için hazır değil." });
    }
  };

  const value = {
    data,
    setData: handleSetData,
    versions,
    saveVersion,
    deleteVersion,
    exportDataToXLSX,
    importDataFromXLSX,
    activeVersion,
    setActiveVersion,
    viewMode,
    setViewMode,
    activeQuarter,
    setActiveQuarter,
    loading,
    fetchData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};