import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Plus, MessageCircle, Save, Edit, Trash2, ChevronDown, ChevronUp, Building2, Link as LinkIcon, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppContext } from '@/context/AppContext';
import { useToast } from "@/components/ui/use-toast";
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

const CompanyOKRs = () => {
  const { data, setData, viewMode } = useContext(AppContext);
  const { objectives, departments } = data;
  const [showObjectiveForm, setShowObjectiveForm] = useState(false);
  const [objectiveInput, setObjectiveInput] = useState('');
  const [editingObjective, setEditingObjective] = useState(null);
  const [expandedObjectives, setExpandedObjectives] = useState([]);
  const { toast } = useToast();
  const isReadOnly = viewMode !== 'Yönetici';

  // AI Suggestions State
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [suggestionType, setSuggestionType] = useState(null); // 'Hedef' or 'KR'

  const toggleObjectiveExpansion = (objectiveId) => {
    setExpandedObjectives(prev => 
      prev.includes(objectiveId) 
        ? prev.filter(id => id !== objectiveId) 
        : [...prev, objectiveId]
    );
  };

  const handleSaveObjective = (e) => {
    e.preventDefault();
    if (!objectiveInput.trim() || isReadOnly) return;

    if (editingObjective) {
      setData(prevData => ({
        ...prevData,
        objectives: prevData.objectives.map(obj =>
          obj.id === editingObjective.id ? { ...obj, title: objectiveInput } : obj
        ),
      }));
      toast({ title: "Şirket hedefi güncellendi! 🔄" });
    } else {
      const newObjective = {
        id: Date.now(),
        title: objectiveInput,
        krs: [], 
        progress: 0,
      };
      setData(prevData => ({ ...prevData, objectives: [...prevData.objectives, newObjective] }));
      toast({ title: "Şirket hedefi oluşturuldu! 🎯" });
    }

    setObjectiveInput('');
    setShowObjectiveForm(false);
    setEditingObjective(null);
  };

  const handleDeleteObjective = (objectiveId) => {
    if (isReadOnly) return;
    const isLinked = departments.some(dept => dept.objectives.some(obj => obj.companyObjectiveId === objectiveId));
    if (isLinked) {
        toast({ variant: "destructive", title: "Silme Başarısız", description: "Bu şirket hedefine bağlı departman hedefleri var. Lütfen önce bağlantıları kaldırın." });
        return;
    }

    setData(prevData => ({
      ...prevData,
      objectives: prevData.objectives.filter(obj => obj.id !== objectiveId),
    }));
    toast({ title: "Şirket hedefi silindi.", variant: "destructive" });
  };

  const handleAiSupport = async (type) => {
    setSuggestionType(type);
    toast({
      title: `🤖 AI'dan yardım isteniyor...`,
      description: `Lütfen bekleyin, ${type} için öneriler oluşturuluyor.`,
    });

    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!geminiApiKey) {
      toast({
        variant: "destructive",
        title: "API Anahtarı Eksik",
        description: "Lütfen .env dosyanıza VITE_GEMINI_API_KEY değerini ekleyin.",
      });
      return;
    }
    
    const currentYear = new Date().getFullYear();

    const prompt = type === 'Hedef'
      ? `Şirketimiz için önümüzdeki 12-18 ay içerisinde gerçekleştirebileceğimiz, 3 adet, birbirinden farklı, ilham verici ve ölçülebilir ana hedef (Objective) önerisi oluştur. Önerilerin ${currentYear} yılı ve sonrasını kapsamasına dikkat et. Cevabını sadece maddeler halinde, her madde bir hedef cümlesi olacak şekilde ver.`
      : `Aşağıdaki ana hedefe (Objective) ulaşmak için, 3 adet, birbirinden farklı, spesifik, ölçülebilir, ulaşılabilir, ilgili ve zamana bağlı (SMART) anahtar sonuç (Key Result) önerisi oluştur. Önerilerin ${currentYear} yılı ve sonrasını kapsamasına dikkat et. Ana Hedef: "${objectiveInput}". Cevabını sadece maddeler halinde, her madde bir KR cümlesi olacak şekilde ver.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "contents": [{"parts": [{"text": prompt}]}],
          "generationConfig": {
            "candidateCount": 1
          }
        })
      });

      const apiData = await response.json();

      if (response.ok && apiData.candidates) {
        const suggestionsText = apiData.candidates[0].content.parts[0].text;
        const suggestionsArray = suggestionsText.split('\n').map(s => s.replace(/^\d+\.\s*/, '').trim()).filter(s => s);
        setAiSuggestions(suggestionsArray);
        setShowSuggestionDialog(true);
      } else {
        throw new Error(apiData?.error?.message || 'Gemini API hatası: Geçersiz yanıt.');
      }
    } catch (error) {
      console.error('AI Destek Hatası:', error);
      toast({
        variant: "destructive",
        title: "AI Destek Alınamadı",
        description: error.message || "Bir şeyler ters gitti.",
      });
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setObjectiveInput(suggestion);
    setShowSuggestionDialog(false);
    setAiSuggestions([]);
    toast({
      title: "Öneri Seçildi!",
      description: "Seçiminiz ilgili alana eklendi.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.h1 className="text-3xl font-bold text-white" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>Şirket OKR'ları Hiyerarşisi</motion.h1>
        {!isReadOnly && <Button onClick={() => { setShowObjectiveForm(true); setEditingObjective(null); setObjectiveInput(''); }} className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-medium"><Plus className="w-4 h-4 mr-2" />Yeni Şirket Hedefi</Button>}
      </div>

      {/* AI Suggestion Dialog */}
      <Dialog open={showSuggestionDialog} onOpenChange={setShowSuggestionDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center"><Brain className="w-5 h-5 mr-2 text-brand-cyan" /> AI Önerileri: {suggestionType}</DialogTitle>
            <DialogDescription>
              Aşağıdaki önerilerden birini seçin veya kendi metninizi yazın.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {aiSuggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <p className="text-sm">{suggestion}</p>
                <Button size="sm" onClick={() => handleSelectSuggestion(suggestion)} className="bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30">
                  <Check className="w-4 h-4 mr-2" /> Seç
                </Button>
              </div>
            ))}
            {aiSuggestions.length === 0 && <p className="text-center text-gray-400">Yükleniyor veya öneri bulunamadı...</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSuggestionDialog(false)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showObjectiveForm && !isReadOnly && (
        <motion.form onSubmit={handleSaveObjective} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glassmorphism rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-3"><MessageCircle className="w-6 h-6 text-brand-cyan" /><h2 className="text-xl font-bold text-white">{editingObjective ? 'Hedefi Düzenle' : 'Yeni Şirket Hedefi Oluştur'}</h2></div>
            <Input value={objectiveInput} onChange={(e) => setObjectiveInput(e.target.value)} placeholder="Hedef açıklamanızı yazın..." className="bg-slate-700 border-brand-cyan/30 focus:border-brand-cyan" />
            <div className="flex justify-end space-x-2">
                <Button type="button" variant="ghost" onClick={() => setShowObjectiveForm(false)}>İptal</Button>
                <Button type="submit" className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark"><Save className="w-4 h-4 mr-2" />{editingObjective ? 'Güncelle' : 'Kaydet'}</Button>
                <Button type="button" onClick={() => handleAiSupport('Hedef')} variant="outline" className="text-brand-cyan border-brand-cyan/50"><Brain className="w-4 h-4 mr-2" />AI Desteği</Button>
            </div>
        </motion.form>
      )}

      <div className="space-y-6">
        {objectives.map((objective, index) => {
            const linkedDepartments = departments.map(dept => ({
                ...dept,
                linkedObjectives: dept.objectives.filter(obj => obj.companyObjectiveId === objective.id)
            })).filter(dept => dept.linkedObjectives.length > 0);

            return (
              <motion.div key={objective.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="glassmorphism rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-brand-cyan rounded-full flex items-center justify-center text-brand-dark font-bold">{index + 1}</div>
                        <h3 className="text-xl font-bold text-white">{objective.title}</h3>
                        <span className="text-2xl font-bold text-brand-cyan">{objective.progress}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        {!isReadOnly && (
                            <>
                                <Button onClick={() => { setEditingObjective(objective); setObjectiveInput(objective.title); setShowObjectiveForm(true); }} variant="outline" size="sm" className="border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10"><Edit className="w-4 h-4" /></Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="border-red-500/30 text-red-500 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                                    <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
                                        <AlertDialogHeader><AlertDialogTitle>Hedefi Silmek Üzeresiniz</AlertDialogTitle><AlertDialogDescription>"{objective.title}" hedefini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel className="border-slate-600 hover:bg-slate-700">İptal</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteObjective(objective.id)} className="bg-red-600 hover:bg-red-700">Sil</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}
                        <Button onClick={() => toggleObjectiveExpansion(objective.id)} variant="ghost" size="sm">
                            {expandedObjectives.includes(objective.id) ? <ChevronUp /> : <ChevronDown />}
                        </Button>
                    </div>
                </div>
                <div className="mb-6 mt-4"><div className="w-full bg-slate-700 rounded-full h-2"><div className="progress-bar h-2 rounded-full" style={{ width: `${objective.progress}%` }}></div></div></div>
                
                {expandedObjectives.includes(objective.id) && (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="space-y-4 mt-4 pl-10 border-l-2 border-brand-cyan/20">
                        {linkedDepartments.length > 0 ? linkedDepartments.map(dept => (
                            <div key={dept.id} className="space-y-2">
                                <h4 className="font-bold text-brand-cyan-light flex items-center"><Building2 className="w-4 h-4 mr-2"/>{dept.name}</h4>
                                {dept.linkedObjectives.map(deptObj => (
                                    <div key={deptObj.id} className="p-3 bg-slate-800/50 rounded-md ml-4">
                                        <div className="flex justify-between items-center">
                                            <p className="text-white">{deptObj.title}</p>
                                            <span className="font-semibold text-brand-cyan-light">{deptObj.progress}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )) : <p className="text-gray-400 text-center py-4">Bu şirket hedefine bağlı departman hedefi bulunmuyor.</p>}
                    </motion.div>
                )}
              </motion.div>
            );
        })}
      </div>
      {objectives.length === 0 && !showObjectiveForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <div className="w-16 h-16 bg-brand-cyan/20 rounded-full flex items-center justify-center mx-auto mb-4"><Target className="w-8 h-8 text-brand-cyan" /></div>
            <h3 className="text-xl font-bold text-white mb-2">Henüz şirket hedefi yok</h3>
            <p className="text-gray-400 mb-6">Başlamak için yeni bir şirket hedefi oluşturun.</p>
            {!isReadOnly && <Button onClick={() => setShowObjectiveForm(true)} className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark"><Plus className="w-4 h-4 mr-2" />İlk Hedefi Oluştur</Button>}
        </motion.div>
      )}
    </div>
  );
};

export default CompanyOKRs;