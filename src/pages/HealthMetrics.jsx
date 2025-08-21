import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Plus, Save, Edit, Trash2, Brain, HeartPulse, Check } from 'lucide-react';
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

const HealthMetrics = () => {
  const { data, setData, viewMode } = useContext(AppContext);
  const { healthMetrics } = data;
  const [showMetricForm, setShowMetricForm] = useState(false);
  const [metricForm, setMetricForm] = useState({ title: '', responsible: '', type: '' });
  const [editingMetric, setEditingMetric] = useState(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const { toast } = useToast();
  const isReadOnly = viewMode !== 'Yönetici';

  const handleSaveMetric = () => {
    if (!metricForm.title.trim() || !metricForm.responsible.trim() || !metricForm.type) {
      toast({ variant: 'destructive', title: "Lütfen tüm alanları doldurun." });
      return;
    }

    const newMetric = {
      id: editingMetric ? editingMetric.id : Date.now(),
      ...metricForm,
      checkIns: editingMetric ? editingMetric.checkIns : [],
    };

    setData(prevData => {
        const newHealthMetrics = editingMetric
            ? prevData.healthMetrics.map(m => m.id === editingMetric.id ? newMetric : m)
            : [...(prevData.healthMetrics || []), newMetric];
        return { ...prevData, healthMetrics: newHealthMetrics };
    });

    closeMetricForm();
    toast({ title: `Sağlık Metriği başarıyla ${editingMetric ? 'güncellendi' : 'oluşturuldu'}!` });
  };

  const handleEditMetric = (metric) => {
    setShowMetricForm(true);
    setMetricForm({
        title: metric.title,
        responsible: metric.responsible,
        type: metric.type,
    });
    setEditingMetric(metric);
  };

  const closeMetricForm = () => {
    setShowMetricForm(false);
    setEditingMetric(null);
    setMetricForm({ title: '', responsible: '', type: '' });
  };

  const handleDeleteMetric = (metricId) => {
    setData(prevData => ({
        ...prevData,
        healthMetrics: prevData.healthMetrics.filter(m => m.id !== metricId),
    }));
    toast({ title: "Sağlık Metriği silindi.", variant: "destructive" });
  };

  const handleAISupport = async () => {
    if (!metricForm.title) {
        toast({ variant: "destructive", title: "Lütfen bir metrik açıklaması girin." });
        return;
    }
    setIsAILoading(true);
    setShowAISuggestions(true);
    try {
        const response = await fetch('http://localhost:3001/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: `Bir OKR koçu olarak, aşağıdaki sağlık metriğini daha etkili hale getirmek için SMART (Özgül, Ölçülebilir, Ulaşılabilir, İlgili, Zamanında) prensiplerine göre 3 alternatif öneri sunun. Mevcut metrik: "${metricForm.title}"`
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.h1 className="text-3xl font-bold text-white" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>Sağlık Metrikleri</motion.h1>
        {!isReadOnly && <Button onClick={() => { setShowMetricForm(true); setEditingMetric(null); }}><Plus className="w-4 h-4 mr-2"/>Yeni Metrik Ekle</Button>}
      </div>

      <Dialog open={showAISuggestions} onOpenChange={setShowAISuggestions}>
        <DialogContent className="glassmorphism text-white max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>AI Destekli Metrik Önerileri</DialogTitle>
                <DialogDescription>
                    Aşağıda, mevcut metriğinizi geliştirmek için AI tarafından oluşturulmuş öneriler bulunmaktadır.
                </DialogDescription>
            </DialogHeader>
            {isAILoading ? (
                <div className="flex items-center justify-center p-8"><Brain className="w-8 h-8 animate-pulse text-brand-cyan"/></div>
            ) : (
                <div className="space-y-3 py-4">
                    {aiSuggestions.map((suggestion, index) => (
                        <div key={index} className="p-3 bg-slate-800/50 rounded-md flex justify-between items-center transition-all hover:bg-slate-800/80">
                            <p className="text-sm">{suggestion}</p>
                            <Button size="sm" onClick={() => { setMetricForm({...metricForm, title: suggestion}); setShowAISuggestions(false); }} className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark">Seç</Button>
                        </div>
                    ))}
                </div>
            )}
        </DialogContent>
      </Dialog>

      {showMetricForm && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glassmorphism rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">{editingMetric ? 'Metriği Düzenle' : 'Yeni Sağlık Metriği'}</h2>
          <div><Label>Metrik Açıklaması</Label><Input value={metricForm.title} onChange={e => setMetricForm({...metricForm, title: e.target.value})} className="bg-slate-700" /></div>
          <div><Label>Sorumlu</Label><Input value={metricForm.responsible} onChange={e => setMetricForm({...metricForm, responsible: e.target.value})} className="bg-slate-700" /></div>
          <div>
            <Label>Metrik Tipi</Label>
            <Select onValueChange={value => setMetricForm({...metricForm, type: value})} value={metricForm.type}>
                <SelectTrigger className="bg-slate-700"><SelectValue placeholder="Seçin..." /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="artan">Artan ↗️</SelectItem>
                    <SelectItem value="azalan">Azalan ↘️</SelectItem>
                    <SelectItem value="dalgalı">Dalgalı 🌀</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={closeMetricForm}>İptal</Button>
            <Button onClick={handleSaveMetric} className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark"><Save className="w-4 h-4 mr-2" />{editingMetric ? 'Güncelle' : 'Kaydet'}</Button>
            <Button onClick={handleAISupport} className="bg-blue-600 hover:bg-blue-700 text-white"><Brain className="w-4 h-4 mr-2" />AI Desteği</Button>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        {(healthMetrics || []).map((metric) => (
          <motion.div key={metric.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glassmorphism rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <HeartPulse className="w-6 h-6 text-brand-cyan" />
                <div>
                  <h3 className="font-bold text-white">{metric.title}</h3>
                  <p className="text-sm text-gray-400">Sorumlu: {metric.responsible}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-bold text-2xl text-brand-cyan-light">{metric.progress || 0}%</span>
                {!isReadOnly && (
                    <>
                        <Button onClick={() => handleEditMetric(metric)} variant="outline" size="icon" className="h-8 w-8"><Edit className="w-4 h-4" /></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
                                <AlertDialogHeader><AlertDialogTitle>Metriği Sil</AlertDialogTitle><AlertDialogDescription>Bu sağlık metriğini silmek istediğinizden emin misiniz?</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteMetric(metric.id)}>Sil</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HealthMetrics;