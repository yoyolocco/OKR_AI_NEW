import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Plus, Building2, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Target, Brain, Save, Edit, Trash2, Link as LinkIcon } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const DepartmentOKRs = () => {
  const { data, setData, viewMode } = useContext(AppContext);
  const { objectives: companyObjectives, departments } = data;
  const [expandedDepts, setExpandedDepts] = useState(departments.map(d => d.id));
  const [expandedObjectives, setExpandedObjectives] = useState([]);
  const [expandedKRs, setExpandedKRs] = useState([]);
  
  const [showObjectiveForm, setShowObjectiveForm] = useState(null);
  const [objectiveInput, setObjectiveInput] = useState('');
  const [editingObjective, setEditingObjective] = useState(null);
  const [selectedCompanyObjective, setSelectedCompanyObjective] = useState('');

  const [showKRForm, setShowKRForm] = useState(null);
  const [krForm, setKrForm] = useState({ title: '', responsible: '', type: '', weight: '', action: '' });
  const [editingKR, setEditingKR] = useState(null);

  const [showNewDeptDialog, setShowNewDeptDialog] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isAILoading, setIsAILoading] = useState(false);
  
  const { toast } = useToast();
  const isReadOnly = viewMode !== 'Yönetici';

  const toggleDepartment = (deptId) => {
    setExpandedDepts(prev => prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]);
  };

  const toggleObjectiveExpansion = (objId) => {
    setExpandedObjectives(prev => prev.includes(objId) ? prev.filter(id => id !== objId) : [...prev, objId]);
  };

  const toggleKRExpansion = (krId) => {
    setExpandedKRs(prev => prev.includes(krId) ? prev.filter(id => id !== krId) : [...prev, krId]);
  };

  const handleAddNewDepartment = () => {
    if (!newDeptName.trim()) {
        toast({ variant: "destructive", title: "Departman adı boş olamaz." });
        return;
    }
    const newDept = {
        id: Date.now(),
        name: newDeptName,
        objectives: [],
        progress: 0
    };
    setData(prev => ({ ...prev, departments: [...prev.departments, newDept] }));
    setNewDeptName('');
    setShowNewDeptDialog(false);
    toast({ title: "Departman Eklendi!", description: `"${newDeptName}" departmanı başarıyla oluşturuldu.` });
  };

  const handleSaveObjective = (deptId) => {
    if (!objectiveInput.trim() || !selectedCompanyObjective || isReadOnly) {
        toast({ variant: 'destructive', title: 'Eksik Bilgi', description: 'Lütfen bir şirket hedefine bağlanın ve departman hedefi açıklamasını girin.' });
        return;
    }

    setData(prev => {
        const newDepartments = prev.departments.map(dept => {
            if (dept.id === deptId) {
                const newObjectives = editingObjective
                    ? dept.objectives.map(obj => obj.id === editingObjective.objId ? { ...obj, title: objectiveInput, companyObjectiveId: Number(selectedCompanyObjective) } : obj)
                    : [...(dept.objectives || []), { id: Date.now(), title: objectiveInput, krs: [], progress: 0, companyObjectiveId: Number(selectedCompanyObjective) }];
                return { ...dept, objectives: newObjectives };
            }
            return dept;
        });
        return { ...prev, departments: newDepartments };
    });

    toast({ title: `Departman hedefi başarıyla ${editingObjective ? 'güncellendi' : 'oluşturuldu'}! 🎉` });
    closeObjectiveForm();
  };

  const closeObjectiveForm = () => {
    setShowObjectiveForm(null);
    setObjectiveInput('');
    setEditingObjective(null);
    setSelectedCompanyObjective('');
  };

  const handleDeleteObjective = (deptId, objId) => {
    if (isReadOnly) return;
    setData(prev => ({
        ...prev,
        departments: prev.departments.map(dept => {
            if (dept.id === deptId) {
                return { ...dept, objectives: dept.objectives.filter(obj => obj.id !== objId) };
            }
            return dept;
        })
    }));
    toast({ title: "Departman hedefi silindi.", variant: "destructive" });
  };
  
  const handleSaveKR = (deptId, objId) => {
    const { title, responsible, type, weight, action } = krForm;
    if (!title.trim() || !responsible.trim() || !type || !weight) {
      toast({ variant: 'destructive', title: "Lütfen tüm KR alanlarını doldurun." });
      return;
    }

    const newKR = {
      id: editingKR ? editingKR.krId : Date.now(),
      title, responsible, type, action,
      weight: parseFloat(weight),
      checkIns: editingKR ? editingKR.checkIns : [],
      startValue: editingKR ? editingKR.startValue : null,
    };
    
    setData(prevData => {
        const newDepartments = prevData.departments.map(dept => {
            if (dept.id === deptId) {
                const newObjectives = dept.objectives.map(obj => {
                    if (obj.id === objId) {
                        const newKRs = editingKR
                            ? obj.krs.map(kr => kr.id === editingKR.krId ? newKR : kr)
                            : [...(obj.krs || []), newKR];
                        return { ...obj, krs: newKRs };
                    }
                    return obj;
                });
                return { ...dept, objectives: newObjectives };
            }
            return dept;
        });
        return { ...prevData, departments: newDepartments };
    });

    closeKrForm();
    toast({ title: `KR başarıyla ${editingKR ? 'güncellendi' : 'oluşturuldu'}! 🚀` });
  };
  
  const handleEditKR = (deptId, objId, kr) => {
    setShowKRForm({ deptId, objId });
    setKrForm({
        title: kr.title,
        responsible: kr.responsible,
        type: kr.type,
        weight: kr.weight.toString(),
        action: kr.action || '',
    });
    setEditingKR({ deptId, objId, krId: kr.id, ...JSON.parse(JSON.stringify(kr)) }); // Deep copy kr
  };
  
  const closeKrForm = () => {
    setShowKRForm(null); 
    setEditingKR(null);
    setKrForm({ title: '', responsible: '', type: '', weight: '', action: '' });
  };

  const handleDeleteKR = (deptId, objId, krId) => {
    if (isReadOnly) return;
    setData(prevData => ({
        ...prevData,
        departments: prevData.departments.map(dept => {
            if (dept.id === deptId) {
                return { ...dept, objectives: dept.objectives.map(obj => {
                        if (obj.id === objId) {
                            return { ...obj, krs: obj.krs.filter(kr => kr.id !== krId) };
                        }
                        return obj;
                    })
                };
            }
            return dept;
        })
    }));
    toast({ title: "KR silindi.", variant: "destructive" });
  };

  const handleAISupport = async () => {
    if (!krForm.title) {
        toast({ variant: "destructive", title: "Lütfen bir KR açıklaması girin." });
        return;
    }
    setIsAILoading(true);
    setShowAISuggestions(true);
    try {
        const response = await fetch('http://localhost:3001/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: `Bir OKR koçu olarak, aşağıdaki anahtar sonucu (KR) daha etkili hale getirmek için SMART (Özgül, Ölçülebilir, Ulaşılabilir, İlgili, Zamanında) prensiplerine göre 3 alternatif öneri sunun. Mevcut KR: "${krForm.title}"`
            }),
        });
        const data = await response.json();
        setAiSuggestions(data.suggestions || []);
    } catch (error) {
        toast({ variant: "destructive", title: "AI Desteği alınamadı.", description: error.message });
    } finally {
        setIsAILoading(false);
    }
  };

  const getKRIcon = (type) => {
    switch (type) {
      case 'artan': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'azalan': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'dalgalı': return <Target className="w-4 h-4 text-yellow-500" />;
      default: return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  const renderKRForm = (deptId, objId) => {
    const objective = departments.find(d => d.id === deptId)?.objectives.find(o => o.id === objId);
    return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-slate-900/70 rounded-lg p-4 space-y-4">
      <h4 className="font-bold text-white">{editingKR ? 'KR Düzenle' : 'Yeni KR Ekle'}</h4>
      <div><Label>KR Açıklaması</Label><Input value={krForm.title} onChange={e => setKrForm({...krForm, title: e.target.value})} className="bg-slate-700" /></div>
      <div><Label>Sorumlu</Label><Input value={krForm.responsible} onChange={e => setKrForm({...krForm, responsible: e.target.value})} className="bg-slate-700" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div>
            <Label>KR Tipi</Label>
            <Select onValueChange={value => setKrForm({...krForm, type: value})} value={krForm.type}>
                <SelectTrigger className="bg-slate-700"><SelectValue placeholder="Seçin..." /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="artan">Artan ↗️</SelectItem>
                    <SelectItem value="azalan">Azalan ↘️</SelectItem>
                    <SelectItem value="dalgalı">Dalgalı 🌀</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div><Label>Ağırlık (%)</Label><Input type="number" value={krForm.weight} onChange={e => setKrForm({...krForm, weight: e.target.value})} className="bg-slate-700" /></div>
      </div>
      <div><Label>Aksiyon Planı</Label><Input value={krForm.action} onChange={e => setKrForm({...krForm, action: e.target.value})} placeholder="Örn: Haftalık takip toplantıları..." className="bg-slate-700" /></div>
      <div className="flex justify-end space-x-2">
        <Button variant="ghost" onClick={closeKrForm}>İptal</Button>
        <Button onClick={() => handleSaveKR(deptId, objId)} className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark"><Save className="w-4 h-4 mr-2" />{editingKR ? 'Güncelle' : 'Kaydet'}</Button>
        <Button onClick={handleAISupport} className="bg-blue-600 hover:bg-blue-700 text-white"><Brain className="w-4 h-4 mr-2" />AI Desteği</Button>
      </div>
    </motion.div>
    );
  };

  const renderObjectiveForm = (deptId) => {
    return (
      <motion.form onSubmit={(e) => {e.preventDefault(); handleSaveObjective(deptId);}} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-slate-800/50 space-y-3">
        <h4 className="font-bold text-white">{editingObjective ? 'Hedefi Düzenle' : 'Yeni Departman Hedefi'}</h4>
        <div>
            <Label>Bağlı Olduğu Şirket Hedefi</Label>
            <Select onValueChange={setSelectedCompanyObjective} value={String(selectedCompanyObjective)}>
                <SelectTrigger className="bg-slate-700"><SelectValue placeholder="Bir şirket hedefine bağlayın..." /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {companyObjectives.map(obj => (
                        <SelectItem key={obj.id} value={String(obj.id)}>{obj.title}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
            <Label>Departman Hedefi Açıklaması</Label>
            <Input value={objectiveInput} onChange={(e) => setObjectiveInput(e.target.value)} placeholder="Hedef açıklamasını yazın..." className="bg-slate-700"/>
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="ghost" onClick={closeObjectiveForm}>İptal</Button>
          <Button type="submit" className="bg-brand-cyan text-brand-dark"><Save className="w-4 h-4 mr-2"/>{editingObjective ? 'Güncelle' : 'Kaydet'}</Button>
        </div>
      </motion.form>
    );
  }

  return (
    <div className="space-y-6 h-full">
        <div className="flex items-center justify-between">
            <motion.h1 className="text-3xl font-bold text-white" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>Departman OKR'ları</motion.h1>
            {!isReadOnly && <Button onClick={() => setShowNewDeptDialog(true)}><Plus className="w-4 h-4 mr-2"/>Yeni Departman</Button>}
        </div>

        <Dialog open={showNewDeptDialog} onOpenChange={setShowNewDeptDialog}>
            <DialogContent className="glassmorphism text-white">
            <DialogHeader><DialogTitle>Yeni Departman Ekle</DialogTitle></DialogHeader>
            <div className="py-4">
                <Label htmlFor="new-dept-name">Departman Adı</Label>
                <Input id="new-dept-name" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} className="bg-slate-700 mt-2" placeholder="Örn: Pazarlama"/>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setShowNewDeptDialog(false)}>İptal</Button>
                <Button onClick={handleAddNewDepartment} className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark">Ekle</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={showAISuggestions} onOpenChange={setShowAISuggestions}>
            <DialogContent className="glassmorphism text-white max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>AI Destekli KR Önerileri</DialogTitle>
                    <DialogDescription>
                        Aşağıda, mevcut KR'ınızı geliştirmek için AI tarafından oluşturulmuş öneriler bulunmaktadır.
                    </DialogDescription>
                </DialogHeader>
                {isAILoading ? (
                    <div className="flex items-center justify-center p-8"><Brain className="w-8 h-8 animate-pulse text-brand-cyan"/></div>
                ) : (
                    <div className="space-y-3 py-4">
                        {aiSuggestions.map((suggestion, index) => (
                            <div key={index} className="p-3 bg-slate-800/50 rounded-md flex justify-between items-center transition-all hover:bg-slate-800/80">
                                <p className="text-sm">{suggestion}</p>
                                <Button size="sm" onClick={() => { setKrForm({...krForm, title: suggestion}); setShowAISuggestions(false); }} className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark">Seç</Button>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>

      <div className="space-y-4">
        {departments.map((department) => (
          <motion.div key={department.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glassmorphism rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-800/30" onClick={() => toggleDepartment(department.id)}>
                <div className="flex items-center space-x-4"><Building2 className="w-6 h-6 text-brand-cyan" /><div><h2 className="text-xl font-bold text-white">{department.name}</h2><p className="text-gray-400 text-sm">{department.objectives?.length || 0} hedef</p></div></div>
                <div className="flex items-center space-x-4"><div className="text-right"><p className="text-2xl font-bold text-brand-cyan">{department.progress || 0}%</p><p className="text-gray-400 text-sm">Tamamlanma</p></div>{expandedDepts.includes(department.id) ? <ChevronUp /> : <ChevronDown />}</div>
            </div>
            {expandedDepts.includes(department.id) && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="border-t border-brand-cyan/20"><div className="p-6 space-y-4">
                  {(department.objectives || []).map((objective) => {
                      const parentObjective = companyObjectives.find(co => co.id === objective.companyObjectiveId);
                      return (
                          <div key={objective.id} className="bg-slate-800/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => toggleObjectiveExpansion(objective.id)}>
                                <div className="flex items-center space-x-3">
                                    <LinkIcon className="w-4 h-4 text-gray-500"/>
                                    <span className="text-sm text-gray-400">Bağlı: {parentObjective?.title || "İlişkilendirilmemiş"}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <h3 className="text-white font-medium">{objective.title}</h3>
                                    <span className="font-semibold text-brand-cyan-light">{objective.progress || 0}%</span>
                                    {expandedObjectives.includes(objective.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                            </div>
                            {expandedObjectives.includes(objective.id) && (
                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="space-y-3 mt-3">
                                    <div className="mb-3"><div className="w-full bg-slate-700 rounded-full h-2"><div className="progress-bar h-2 rounded-full" style={{ width: `${objective.progress || 0}%` }}></div></div></div>
                                    <div className="flex items-center space-x-2">
                                        <Button onClick={() => { setEditingObjective({deptId: department.id, objId: objective.id}); setObjectiveInput(objective.title); setSelectedCompanyObjective(String(objective.companyObjectiveId || '')); setShowObjectiveForm(department.id); }} variant="outline" size="icon" className="h-7 w-7"><Edit className="w-3 h-3" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="outline" size="icon" className="h-7 w-7"><Trash2 className="w-3 h-3" /></Button></AlertDialogTrigger>
                                            <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
                                                <AlertDialogHeader><AlertDialogTitle>Hedefi Sil</AlertDialogTitle><AlertDialogDescription>Bu hedefi ve bağlı tüm KR'ları silmek istediğinizden emin misiniz?</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteObjective(department.id, objective.id)}>Sil</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                    {(objective.krs || []).map(kr => (
                                        <div key={kr.id} className="bg-slate-900/50 rounded-md p-3 mt-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => toggleKRExpansion(kr.id)}>
                                                    {getKRIcon(kr.type)}
                                                    <span className="text-white text-sm">{kr.title}</span>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <span className="font-semibold text-brand-cyan-light">{kr.progress || 0}%</span>
                                                    {!isReadOnly && (
                                                        <>
                                                            <Button onClick={() => handleEditKR(department.id, objective.id, kr)} variant="outline" size="icon" className="h-7 w-7"><Edit className="w-3 h-3" /></Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild><Button variant="outline" size="icon" className="h-7 w-7"><Trash2 className="w-3 h-3" /></Button></AlertDialogTrigger>
                                                                <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
                                                                    <AlertDialogHeader><AlertDialogTitle>KR Sil</AlertDialogTitle><AlertDialogDescription>Bu KR'ı silmek istediğinizden emin misiniz?</AlertDialogDescription></AlertDialogHeader>
                                                                    <AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteKR(department.id, objective.id, kr.id)}>Sil</AlertDialogAction></AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </>
                                                    )}
                                                    <Button onClick={() => toggleKRExpansion(kr.id)} variant="ghost" size="sm">
                                                        {expandedKRs.includes(kr.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                            {expandedKRs.includes(kr.id) && (
                                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="space-y-2 mt-2 pl-7">
                                                    <div className="text-xs text-gray-400">Sorumlu: {kr.responsible}</div>
                                                    <div className="text-xs text-gray-400">Ağırlık: {kr.weight}%</div>
                                                    {kr.action && <div className="text-xs text-gray-400">Aksiyon: {kr.action}</div>}
                                                    {kr.startValue !== null && <div className="text-xs text-gray-400">Başlangıç Değeri: {kr.startValue}</div>}
                                                    {(kr.checkIns || []).length > 0 && (
                                                        <div className="text-xs text-gray-400">
                                                            Check-ins:
                                                            <ul className="list-disc list-inside ml-2">
                                                                {kr.checkIns.map((ci, ciIndex) => (
                                                                    <li key={ciIndex}>{ci.period}: Hedef {ci.target}, Gerçekleşen {ci.actual}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </div>
                                    ))}
                                    {showKRForm?.deptId === department.id && showKRForm?.objId === objective.id 
                                      ? renderKRForm(department.id, objective.id)
                                      : <Button onClick={() => { closeKrForm(); setShowKRForm({ deptId: department.id, objId: objective.id }); }} variant="outline" size="sm" className="w-full mt-3"><Plus className="w-3 h-3 mr-2" />KR Ekle</Button>
                                    }
                                </motion.div>
                            )}
                          </div>
                      );
                  })}
                  {showObjectiveForm === department.id ? renderObjectiveForm(department.id) : <Button onClick={() => { closeObjectiveForm(); setShowObjectiveForm(department.id); }} variant="outline" className="w-full"><Plus className="w-4 h-4 mr-2" />Yeni Hedef Ekle</Button>}
                </div></motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DepartmentOKRs;