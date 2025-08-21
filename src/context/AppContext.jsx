import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';

export const AppContext = createContext();

const initialData = {
  objectives: [],
  departments: [],
  healthMetrics: [],
  orgChart: {},
};

// --- Progress Calculation Logic ---
const calculateKrProgress = (kr, activeQuarters) => {
  console.log("Calculating progress for KR:", kr.title, "Type:", kr.type, "Start Value:", kr.startValue, "Active Quarters:", activeQuarters);
  if (!kr.checkIns || kr.checkIns.length === 0) {
    console.log("No check-ins found for KR.");
    return 0;
  }

  let relevantCheckIns = [];

  if (activeQuarters.includes('Tümü')) {
    relevantCheckIns = kr.checkIns;
  } else {
    const allPeriods = new Set();
    activeQuarters.forEach(aq => {
        allPeriods.add(aq);
        const year = aq.substring(0, 4);
        const quarter = aq.substring(5, 6);
        const months = [];
        if (quarter === '1') { months.push(`${year}01`, `${year}02`, `${year}03`); }
        if (quarter === '2') { months.push(`${year}04`, `${year}05`, `${year}06`); }
        if (quarter === '3') { months.push(`${year}07`, `${year}08`, `${year}09`); }
        if (quarter === '4') { months.push(`${year}10`, `${year}11`, `${year}12`); }
        months.forEach(m => allPeriods.add(m));
    });
    relevantCheckIns = kr.checkIns.filter(ci => allPeriods.has(ci.period));
  }

  let checkInToUse = null;
  if (relevantCheckIns.length > 0) {
    // Sort by period to get the latest one
    relevantCheckIns.sort((a, b) => b.period.localeCompare(a.period));
    for (let i = 0; i < relevantCheckIns.length; i++) {
      const ci = relevantCheckIns[i];
      if (parseFloat(ci.actual) !== 0 || parseFloat(ci.target) !== 0) {
        checkInToUse = ci;
        break;
      }
    }
  }

  if (!checkInToUse) {
    console.log("No meaningful check-in found for the criteria.");
    return 0;
  }

  const target = parseFloat(checkInToUse.target);
  const actual = parseFloat(checkInToUse.actual);
  const startValue = parseFloat(kr.startValue) || 0;

  console.log("Using check-in:", checkInToUse, "Target:", target, "Actual:", actual, "Start Value:", startValue);

  if (isNaN(target) || isNaN(actual)) {
    console.warn("Target or Actual is NaN.");
    return 0;
  }

  let progress = 0;
  if (kr.type === 'azalan') {
    if (startValue === target) {
      progress = actual <= target ? 100 : 0;
    } else {
      progress = ((startValue - actual) / (startValue - target)) * 100;
    }
  } else if (kr.type === 'artan') {
    if (startValue === target) {
      progress = actual >= target ? 100 : 0;
    } else {
      progress = ((actual - startValue) / (target - startValue)) * 100;
    }
  } else { // dalgalı veya diğer tipler
    if (target === 0) {
      progress = actual > 0 ? 100 : 0;
    } else {
      progress = (actual / target) * 100;
    }
  }

  progress = Math.round(Math.max(0, Math.min(progress, 100)));
  console.log("Calculated progress:", progress);
  return progress;
};

const calculateObjectiveProgress = (objective) => {
  if (!objective.krs || objective.krs.length === 0) return 0;
  const totalWeight = objective.krs.reduce((sum, kr) => sum + (kr.weight || 0), 0);
  if (totalWeight === 0) return 0;

  const weightedProgress = objective.krs.reduce((sum, kr) => sum + (kr.progress * (kr.weight || 0)), 0);
  return Math.round(weightedProgress / totalWeight);
};

const calculateOverallProgress = (data, activeQuarter) => {
    const newData = JSON.parse(JSON.stringify(data));

    // 1. Calculate KR and then Department Objective progress
    newData.departments.forEach(dept => {
        (dept.objectives || []).forEach(obj => {
            (obj.krs || []).forEach(kr => {
                kr.progress = calculateKrProgress(kr, activeQuarter);
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
        } else if (compObj.krs && compObj.krs.length > 0) {
            (compObj.krs || []).forEach(kr => {
                kr.progress = calculateKrProgress(kr, activeQuarter);
            });
            compObj.progress = calculateObjectiveProgress(compObj);
        } else {
            compObj.progress = 0;
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

    // 4. Calculate Health Metric progress
    (newData.healthMetrics || []).forEach(metric => {
        metric.progress = calculateKrProgress(metric, activeQuarter);
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
  const [activeQuarter, setActiveQuarter] = useState(['Tümü']);
  const [loading, setLoading] = useState(true);
  const [processedData, setProcessedData] = useState(initialData);

  const fetchData = useCallback(async () => {
    if (!user) {
      console.log("fetchData: User not logged in, skipping data fetch.");
      setLoading(false);
      return;
    }
    setLoading(true);
    console.log("fetchData: Attempting to fetch data for user:", user.id);
    
    const { data: okrData, error: okrError } = await supabase
      .from('okr_data')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (okrError) {
      console.error("fetchData: Error fetching OKR data from Supabase:", okrError);
      toast({ variant: "destructive", title: "Veri alınamadı", description: okrError.message });
    } else if (okrData && okrData.length > 0) {
      console.log("fetchData: OKR data fetched successfully:", okrData[0]);
      setData({
        objectives: okrData[0].objectives || [],
        departments: okrData[0].departments || [],
        healthMetrics: okrData[0].health_metrics || [],
        orgChart: okrData[0].org_chart || initialData.orgChart,
      });
    } else {
      console.log("fetchData: No OKR data found for user, initializing with empty data.");
      setData(initialData);
    }

    const { data: versionData, error: versionError } = await supabase
      .from('okr_versions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (versionError) {
      console.error("fetchData: Error fetching versions from Supabase:", versionError);
      toast({ variant: "destructive", title: "Versiyonlar alınamadı", description: versionError.message });
    } else {
      console.log("fetchData: Versions fetched successfully:", versionData);
      setVersions(versionData || []);
    }
    
    setLoading(false);
    console.log("fetchData: Data fetch process completed.");
  }, [user, toast]);

  useEffect(() => {
    console.log("fetchData useEffect triggered");
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const calculatedData = calculateOverallProgress(data, activeQuarter);
    setProcessedData(calculatedData);
  }, [data, activeQuarter]);

  const updateSupabaseData = useCallback(async (newData) => {
    if (!user) {
      console.log("updateSupabaseData: User not logged in, skipping data update.");
      return;
    }
    console.log("updateSupabaseData: Attempting to update data for user:", user.id, "with data:", newData);
    const { data: existingData, error: fetchError } = await supabase
      .from('okr_data')
      .select('id')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error("updateSupabaseData: Error fetching existing data from Supabase:", fetchError);
      toast({ variant: "destructive", title: "Veri güncellenemedi", description: fetchError.message });
      return;
    }

    const updatePayload = {
      user_id: user.id,
      objectives: newData.objectives,
      departments: newData.departments,
      health_metrics: newData.healthMetrics,
      org_chart: newData.orgChart,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (existingData && existingData.length > 0) {
      console.log("updateSupabaseData: Existing data found, attempting to update record with ID:", existingData[0].id);
      const { error: updateError } = await supabase
        .from('okr_data')
        .update(updatePayload)
        .eq('id', existingData[0].id);
      error = updateError;
    } else {
      console.log("updateSupabaseData: No existing data found, attempting to insert new record.");
      const { error: insertError } = await supabase
        .from('okr_data')
        .insert(updatePayload);
      error = insertError;
    }

    if (error) {
      console.error("updateSupabaseData: Error saving data to Supabase:", error);
      toast({ variant: "destructive", title: "Veri kaydedilemedi", description: error.message });
    } else {
      console.log("updateSupabaseData: Data saved successfully to Supabase.");
      toast({ title: "Veriler kaydedildi!", description: "Değişiklikleriniz otomatik olarak kaydedildi." });
    }
  }, [user, toast]);

  const handleSetData = (newData) => {
    const updatedData = typeof newData === 'function' ? newData(data) : newData;
    setData(updatedData);
    updateSupabaseData(updatedData);
  };

  const saveVersion = async (name) => {
    if (!user) return;
    const newVersion = { 
      user_id: user.id,
      name,
      data: {
        objectives: processedData.objectives,
        departments: processedData.departments,
        healthMetrics: processedData.healthMetrics,
        orgChart: processedData.orgChart,
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

    // Process Health Metrics
    (dataToExport.healthMetrics || []).forEach(metric => {
        const row = {
            'Hedef Tipi': 'Health Metric',
            'Departman Adı': 'Genel',
            'Şirket Hedefi': '',
            'Departman Hedefi': '',
            'KR Açıklaması': metric.title,
            'Sorumlu': metric.responsible,
            'KR Tipi': metric.type,
            'Ağırlık': '',
            'Başlangıç Değeri': metric.startValue,
            'İlerleme (%)': metric.progress,
            'Aksiyon': metric.action,
        };
        sortedPeriods.forEach(period => {
            const checkIn = metric.checkIns?.find(ci => ci.period === period);
            row[`Hedef_${period}`] = checkIn ? checkIn.target : '';
            row[`Gerçekleşen_${period}`] = checkIn ? checkIn.actual : '';
        });
        allOKRData.push(row);
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
    let newObjectives = JSON.parse(JSON.stringify(data.objectives));
    let newDepartments = JSON.parse(JSON.stringify(data.departments));
    let newHealthMetrics = JSON.parse(JSON.stringify(data.healthMetrics));

    if (mode === 'overwrite') {
      newObjectives = [];
      newDepartments = [];
      newHealthMetrics = [];
    }

    const companyRows = parsedData.filter(row => row['Hedef Tipi'] === 'Şirket');
    const departmentRows = parsedData.filter(row => row['Hedef Tipi'] === 'Departman');
    const healthMetricRows = parsedData.filter(row => row['Hedef Tipi'] === 'Health Metric');

    // Process Company Objectives first
    companyRows.forEach(row => {
        const krData = {};
        const checkIns = [];

        krData.title = row['KR Açıklaması'];
        krData.responsible = row['Sorumlu'];
        krData.type = row['KR Tipi'];
        krData.weight = parseFloat(row['Ağırlık']);
        krData.startValue = parseFloat(row['Başlangıç Değeri']);
        krData.action = row['Aksiyon'];

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
        krData.checkIns = checkIns.sort((a, b) => a.period.localeCompare(b.period));

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
    });

    // Then process Department Objectives
    departmentRows.forEach(row => {
        const krData = {};
        const checkIns = [];

        krData.title = row['KR Açıklaması'];
        krData.responsible = row['Sorumlu'];
        krData.type = row['KR Tipi'];
        krData.weight = parseFloat(row['Ağırlık']);
        krData.startValue = parseFloat(row['Başlangıç Değeri']);
        krData.action = row['Aksiyon'];

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
        krData.checkIns = checkIns.sort((a, b) => a.period.localeCompare(b.period));

        let dept = newDepartments.find(d => d.name === row['Departman Adı']);
        if (!dept) {
            dept = { id: Date.now() + Math.random(), name: row['Departman Adı'], objectives: [], progress: 0 };
            newDepartments.push(dept);
        }
        let deptObj = dept.objectives.find(o => o.title === row['Departman Hedefi']);
        if (!deptObj) {
            const companyObjective = newObjectives.find(co => co.title === row['Şirket Hedefi']);
            deptObj = { id: Date.now() + Math.random(), title: row['Departman Hedefi'], krs: [], progress: 0, companyObjectiveId: companyObjective ? companyObjective.id : null };
            dept.objectives.push(deptObj);
        }
        const existingKr = deptObj.krs.find(k => k.title === krData.title && k.responsible === krData.responsible);
        if (existingKr) {
            Object.assign(existingKr, { ...krData, id: existingKr.id });
        } else {
            deptObj.krs.push({ ...krData, id: Date.now() + Math.random() });
        }
    });

    // Process Health Metrics
    healthMetricRows.forEach(row => {
        const krData = {};
        const checkIns = [];

        krData.title = row['KR Açıklaması'];
        krData.responsible = row['Sorumlu'];
        krData.type = row['KR Tipi'];
        krData.startValue = parseFloat(row['Başlangıç Değeri']);
        krData.action = row['Aksiyon'];

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
        krData.checkIns = checkIns.sort((a, b) => a.period.localeCompare(b.period));

        const existingMetric = newHealthMetrics.find(m => m.title === krData.title && m.responsible === krData.responsible);
        if (existingMetric) {
            Object.assign(existingMetric, { ...krData, id: existingMetric.id });
        } else {
            newHealthMetrics.push({ ...krData, id: Date.now() + Math.random() });
        }
    });

    setData({ objectives: newObjectives, departments: newDepartments, healthMetrics: newHealthMetrics, orgChart: data.orgChart });
    toast({ title: "Başarılı!", description: "Veriler Excel'den başarıyla içe aktarıldı." });
  };

  const value = {
    data: processedData,
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