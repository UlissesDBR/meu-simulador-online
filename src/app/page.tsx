'use client';
import { useState, useMemo, FC, ReactNode, useRef, useLayoutEffect } from 'react';
import { AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, BarChart, Bar, Line } from 'recharts';
import { TrendingUp, Droplets, Leaf, Star, ArrowRight, ArrowDown, ArrowUp, Truck, Users, Gauge, Scale, Route, PiggyBank, DollarSign, SlidersHorizontal, AreaChart as AreaChartIcon, Goal, Car, Fuel } from 'lucide-react';

// --- Tipos e Dados Padrão ---
interface ScenarioData {
  mediaCombustivel: number;
  pesoMedio: number;
  marchaLentaPct: number;
  inerciaPct: number;
  freadasBruscas: number;
  distanciaTotal: number;
  qtdVeiculos: number;
}
type Segmento = 'rodoviario' | 'offRoad' | 'onibus';
const segmentos: Record<Segmento, { inercia: number; marchaLenta: number; freadas: number }> = {
  rodoviario: { inercia: 30, marchaLenta: 7, freadas: 3 },
  offRoad: { inercia: 15, marchaLenta: 20, freadas: 10 },
  onibus: { inercia: 25, marchaLenta: 15, freadas: 5 },
};
const initialState: ScenarioData = {
  mediaCombustivel: 2.5,
  pesoMedio: 30,
  marchaLentaPct: 15,
  inerciaPct: 20,
  freadasBruscas: 5,
  distanciaTotal: 10000,
  qtdVeiculos: 50,
};

// --- Lógica de Notas ---
const calculateScore = (kpiName: string, value: number, segmentoAtual: { inercia: number; marchaLenta: number; freadas: number; }) => {
    let score = 2;
    const metaInercia = segmentoAtual.inercia;
    const metaMarchaLenta = segmentoAtual.marchaLenta;
    switch (kpiName) {
        case 'Inércia': if (value >= metaInercia) score = 10; else if (value >= metaInercia * 0.75) score = 8; else if (value >= metaInercia * 0.5) score = 6; else if (value >= metaInercia * 0.25) score = 4; break;
        case 'Marcha Lenta': if (value <= metaMarchaLenta) score = 10; else if (value <= metaMarchaLenta * 1.5) score = 8; else if (value <= metaMarchaLenta * 2.0) score = 6; else if (value <= metaMarchaLenta * 2.5) score = 4; break;
        case 'Freadas': if (value <= segmentoAtual.freadas) score = 10; else if (value <= segmentoAtual.freadas * 1.5) score = 8; else if (value <= segmentoAtual.freadas * 2) score = 6; else if (value <= segmentoAtual.freadas * 2.5) score = 4; break;
        case 'notaGeral': score = value; break;
    }
    let grade = 'E';
    if (score >= 9) grade = 'A'; else if (score >= 7) grade = 'B'; else if (score >= 5) grade = 'C'; else if (score >= 3) grade = 'D';
    return { score, grade };
};

// --- Componentes de UI ---
const HeaderStat: FC<{ title: string; value: string; icon: ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="flex items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200 min-w-[180px]">
    <div className={`p-2 rounded-full mr-3`} style={{ backgroundColor: `${color}1A`, color: color }}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{title}</p>
      <p className="text-base font-bold text-gray-800">{value}</p>
    </div>
  </div>
);


const InputSection: FC<{ title: string; children: ReactNode; icon: ReactNode }> = ({ title, children, icon }) => ( <div> <div className="flex items-center gap-3 mb-4"> <div className="text-blue-600 bg-blue-50 p-2 rounded-lg">{icon}</div> <h2 className="text-base font-semibold text-gray-800">{title}</h2> </div> <div className="flex flex-col gap-4 pl-1">{children}</div> </div> );
const InputField: FC<{ label: string; value: number; onChange: (value: number) => void; unit: string; step?: number }> = ({ label, value, onChange, unit, step = 1 }) => ( <div> <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label> <div className="flex items-center gap-2"> <input type="number" value={value} step={step} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="w-full p-2 bg-slate-100 border-2 border-transparent rounded-md focus:bg-white focus:border-blue-500 focus:ring-0 text-gray-900 transition-colors"/> <span className="text-sm text-gray-500 min-w-[50px]">{unit}</span> </div> </div> );
const SliderField: FC<{ label: string; value: number; onChange: (value: number) => void; unit: string; min: number; max: number; step: number; }> = ({ label, value, onChange, unit, min, max, step }) => ( <div> <div className="flex justify-between items-center mb-1"> <label className="block text-sm font-medium text-gray-600">{label}</label> <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded"> {unit === "R$/L" ? value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) : `${value}${unit}`} </span> </div> <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer range-lg accent-blue-600" /> </div> );
const SegmentControl: FC<{value: Segmento, onChange: (value: Segmento) => void}> = ({ value, onChange }) => { const options: {key: Segmento, label: string}[] = [ { key: 'rodoviario', label: 'Rodoviário'}, { key: 'offRoad', label: 'Off-Road'}, { key: 'onibus', label: 'Ônibus'} ]; return ( <div> <label className="block text-sm font-medium text-gray-600 mb-1">Segmento da Frota</label> <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg"> {options.map(opt => ( <button key={opt.key} onClick={() => onChange(opt.key)} className={`px-2 py-1.5 text-sm font-semibold rounded-md transition-colors ${value === opt.key ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}> {opt.label} </button> ))} </div> </div> ); };
const ResultCard: FC<{ icon: ReactNode; title: string; value: string; color: string; }> = ({ icon, title, value, color }) => ( <div className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center border-t-4`} style={{ borderColor: color }}> <div className="text-2xl mx-auto w-fit mb-1" style={{ color }}>{icon}</div> <p className="text-xl font-bold text-gray-800">{value}</p> <p className="text-xs text-gray-500">{title}</p> </div> );
const KpiComparisonCard: FC<{ title: string, unit: string, actual: number, goal: number, higherIsBetter?: boolean, icon: ReactNode }> = ({ title, unit, actual, goal, higherIsBetter = false, icon }) => { const diff = goal - actual; const diffPct = (actual !== 0) ? ((diff / actual) * 100) : 0; const isBetter = higherIsBetter ? diff > 0 : diff < 0; const formatOptions: Intl.NumberFormatOptions = { maximumFractionDigits: (unit.includes('%') || unit.includes('ton')) ? 0 : 1 }; const formattedActual = actual.toLocaleString('pt-BR', { maximumFractionDigits: (unit.includes('km/mês')) ? 0 : 1 }); const formattedGoal = goal.toLocaleString('pt-BR', { maximumFractionDigits: (unit.includes('km/mês')) ? 0 : 1 }); const formattedDiff = diff.toLocaleString('pt-BR', { signDisplay: 'always', maximumFractionDigits: (unit.includes('km/mês')) ? 0 : 1 }); const formattedDiffPct = diffPct.toLocaleString('pt-BR', { signDisplay: 'always', maximumFractionDigits: 1 }); return ( <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between"> <div> <div className="flex items-center mb-2"> <div className="text-xl text-blue-600 mr-2">{icon}</div> <p className="text-base font-medium text-gray-700">{title} <span className="text-xs text-gray-400">({unit})</span></p> </div> <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center text-center"> <div> <p className="text-xs text-gray-500">Atual</p> <p className="text-lg font-bold text-gray-800 break-words">{formattedActual}</p> </div> <ArrowRight size={24} className="text-gray-400 mx-auto" /> <div> <p className="text-xs text-gray-500">Meta</p> <p className="text-lg font-bold text-blue-600 break-words">{formattedGoal}</p> </div> </div> </div> <div className={`mt-3 pt-3 border-t border-gray-100 text-center ${isBetter ? 'text-green-600' : 'text-red-600'}`}> <p className="text-xs text-gray-500">Diferença</p> <div className="flex items-center justify-center gap-1 mt-1"> {diff !== 0 && (isBetter ? <ArrowUp size={16} /> : <ArrowDown size={16} />)} <p className="text-lg font-bold">{formattedDiff} ({formattedDiffPct}%)</p> </div> </div> </div> ); };
const FinancialCard: FC<{ period: string; savingValue: number; }> = ({ period, savingValue }) => ( <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center"> <p className="text-sm font-medium text-gray-600">{period}</p> <div className="flex items-center justify-center gap-2 mt-2"> <PiggyBank className="text-green-600" size={20}/> <p className="text-xl font-bold text-gray-800"> {savingValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} </p> </div> </div> );
const CustomCombinedTooltip: FC<any> = ({ active, payload, label }) => { if (active && payload && payload.length) { const economiaMensal = payload[0].value; const economiaAcumulada = payload[1].value; return ( <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200"> <p className="font-bold text-gray-800">{label}</p> <p className="text-sm text-purple-600"> Economia Mês: {economiaMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} </p> <p className="text-sm text-blue-600"> Economia Acumulada: {economiaAcumulada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} </p> </div> ); } return null; };

const Logo: FC = () => (
    <div className="flex items-center gap-3">
      <img src="/logo.png" alt="Fleet Hub Logo" className="h-32 w-auto" />
      <span className="text-2xl font-bold text-gray-800">
        Fleet Hub <span className="text-blue-600">Simulator</span>
      </span>
    </div>
);

// --- Componente Principal da Página ---
export default function SimuladorPage() {
  const [dadosAtuais, setDadosAtuais] = useState<ScenarioData>(initialState);
  const [metas, setMetas] = useState<ScenarioData>({ ...initialState, mediaCombustivel: 2.8, pesoMedio: 25, marchaLentaPct: 7, inerciaPct: 30, freadasBruscas: 3 });
  const [segmento, setSegmento] = useState<Segmento>('rodoviario');
  const [precoCombustivel, setPrecoCombustivel] = useState(5.50);

  const handleSegmentoChange = (novoSegmento: Segmento) => {
    setSegmento(novoSegmento);
    const metasPadrao = segmentos[novoSegmento];
    setMetas(prev => ({ ...prev, inerciaPct: metasPadrao.inercia, marchaLentaPct: metasPadrao.marchaLenta, freadasBruscas: metasPadrao.freadas }));
  };

  const leftColumnRef = useRef<HTMLDivElement>(null);
  const rightColumnCardsRef = useRef<HTMLDivElement>(null);
  const [graphHeight, setGraphHeight] = useState(300);

  useLayoutEffect(() => {
    const calculateHeight = () => {
      if (leftColumnRef.current && rightColumnCardsRef.current) {
        const leftHeight = leftColumnRef.current.offsetHeight;
        const rightCardsHeight = rightColumnCardsRef.current.offsetHeight;
        const remainingHeight = leftHeight - rightCardsHeight - 24;
        setGraphHeight(remainingHeight > 200 ? remainingHeight : 200);
      }
    };
    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, [dadosAtuais, metas, segmento, precoCombustivel]);

  const resultados = useMemo(() => {
      const distanciaTotalFrota = dadosAtuais.distanciaTotal * dadosAtuais.qtdVeiculos;
      const litrosAtuais = distanciaTotalFrota / (dadosAtuais.mediaCombustivel || 1);
      const litrosMeta = distanciaTotalFrota / (metas.mediaCombustivel || 1);
      const economiaLitros = litrosAtuais - litrosMeta;
      const economiaMensalReais = economiaLitros > 0 ? economiaLitros * precoCombustivel : 0;
      const economiaAnualLitros = economiaLitros > 0 ? economiaLitros * 12 : 0; // Cálculo adicionado
      const economiaPercentual = (litrosAtuais > 0) ? (economiaLitros / litrosAtuais) * 100 : 0;
      const reducaoCO2 = (economiaLitros * 2.68) / 1000;
      const notaAtualGeral = (calculateScore('Inércia', dadosAtuais.inerciaPct, segmentos[segmento]).score + calculateScore('Marcha Lenta', dadosAtuais.marchaLentaPct, segmentos[segmento]).score + calculateScore('Freadas', dadosAtuais.freadasBruscas, segmentos[segmento]).score) / 3;
      const notaMetaGeral = (calculateScore('Inércia', metas.inerciaPct, segmentos[segmento]).score + calculateScore('Marcha Lenta', metas.marchaLentaPct, segmentos[segmento]).score + calculateScore('Freadas', metas.freadasBruscas, segmentos[segmento]).score) / 3;
      const notaAtualGrade = calculateScore('notaGeral', notaAtualGeral, segmentos[segmento]).grade;
      const notaMetaGrade = calculateScore('notaGeral', notaMetaGeral, segmentos[segmento]).grade;
      const projecaoData = Array.from({length: 12}, (_, i) => { const economiaMesAtual = economiaMensalReais; const economiaAcumulada = economiaMensalReais * (i + 1); return { mes: `Mês ${i + 1}`, "Economia Mensal (R$)": economiaMesAtual, "Economia Acumulada (R$)": economiaAcumulada }; });
      
      return { 
        litrosAtuais, 
        economiaLitros, 
        economiaAnualLitros, // Propriedade adicionada ao retorno
        economiaPercentual, 
        reducaoCO2, 
        projecao: projecaoData, 
        notaAtual: `${notaAtualGeral.toFixed(1)} (${notaAtualGrade})`, 
        notaMeta: `${notaMetaGeral.toFixed(1)} (${notaMetaGrade})`, 
        economia1Mes: economiaMensalReais, 
        economia3Meses: economiaMensalReais * 3, 
        economia6Meses: economiaMensalReais * 6, 
        economia12Meses: economiaMensalReais * 12 
      };
  }, [dadosAtuais, metas, segmento, precoCombustivel]);

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-gray-800">
      {/* HEADER ATUALIZADO */}
      <header className="bg-white sticky top-0 z-10 shadow-md">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-32"> {/* Altura mínima para caber o logo */}
            <Logo />
            <div className="flex items-center gap-6">
              <HeaderStat title="Veículos na Frota" value={dadosAtuais.qtdVeiculos.toString()} icon={<Car size={24}/>} color="#0284c7" />
              <HeaderStat title="Consumo Atual da Frota" value={`${Math.round(resultados.litrosAtuais).toLocaleString('pt-BR')} L`} icon={<Fuel size={24}/>} color="#16a34a" />
            </div>
          </div>
        </div>
        {/* Borda em gradiente fina */}
        <div className="h-0.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600"></div>
      </header>
      
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div ref={leftColumnRef} className="lg:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit space-y-6">
            <InputSection title="1. Dados Gerais da Frota" icon={<SlidersHorizontal size={20}/>}>
              <SegmentControl value={segmento} onChange={handleSegmentoChange} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Qtd. de Veículos" value={dadosAtuais.qtdVeiculos} onChange={(v) => setDadosAtuais(d => ({ ...d, qtdVeiculos: v }))} unit="und" />
                <InputField label="Dist. Média" value={dadosAtuais.distanciaTotal} onChange={(v) => { setDadosAtuais(d => ({ ...d, distanciaTotal: v })); setMetas(m => ({ ...m, distanciaTotal: v }))}} unit="km/mês" />
              </div>
              <SliderField label="Valor do Diesel" value={precoCombustivel} onChange={setPrecoCombustivel} unit="R$/L" min={4} max={10} step={0.01}/>
            </InputSection>
            <hr className="border-slate-200" />
            <InputSection title="2. Desempenho Médio Atual" icon={<AreaChartIcon size={20}/>}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Média de Combustível" value={dadosAtuais.mediaCombustivel} onChange={(v) => setDadosAtuais(d => ({ ...d, mediaCombustivel: v }))} unit="km/L" step={0.1}/>
                    <InputField label="Peso Médio Carga" value={dadosAtuais.pesoMedio} onChange={(v) => setDadosAtuais(d => ({ ...d, pesoMedio: v }))} unit="ton" step={0.5}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SliderField label="Inércia" value={dadosAtuais.inerciaPct} onChange={(v) => setDadosAtuais(d => ({...d, inerciaPct: v}))} unit="%" min={5} max={60} step={5} />
                    <SliderField label="Marcha Lenta" value={dadosAtuais.marchaLentaPct} onChange={(v) => setDadosAtuais(d => ({...d, marchaLentaPct: v}))} unit="%" min={5} max={60} step={5} />
                </div>
                <SliderField label="Freadas Bruscas" value={dadosAtuais.freadasBruscas} onChange={(v) => setDadosAtuais(d => ({...d, freadasBruscas: v}))} unit="/100km" min={0} max={100} step={1} />
            </InputSection>
            <hr className="border-slate-200" />
            <InputSection title="3. Metas de Desempenho" icon={<Goal size={20} />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Média de Combustível" value={metas.mediaCombustivel} onChange={(v) => setMetas(m => ({ ...m, mediaCombustivel: v }))} unit="km/L" step={0.1}/>
                    <InputField label="Peso Médio Carga" value={metas.pesoMedio} onChange={(v) => setMetas(m => ({ ...m, pesoMedio: v }))} unit="ton" step={0.5}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SliderField label="Inércia" value={metas.inerciaPct} onChange={(v) => setMetas(m => ({...m, inerciaPct: v}))} unit="%" min={5} max={60} step={5} />
                    <SliderField label="Marcha Lenta" value={metas.marchaLentaPct} onChange={(v) => setMetas(m => ({...m, marchaLentaPct: v}))} unit="%" min={5} max={60} step={5} />
                </div>
                <SliderField label="Freadas Bruscas" value={metas.freadasBruscas} onChange={(v) => setMetas(m => ({...m, freadasBruscas: v}))} unit="/100km" min={0} max={100} step={1} />
            </InputSection>
          </div>
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div ref={rightColumnCardsRef} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <KpiComparisonCard icon={<Route />} title="Distância Média" unit="km/mês" actual={dadosAtuais.distanciaTotal} goal={metas.distanciaTotal} higherIsBetter={true} />
                    <KpiComparisonCard icon={<Gauge />} title="Média Combustível" unit="km/L" actual={dadosAtuais.mediaCombustivel} goal={metas.mediaCombustivel} higherIsBetter={true} />
                    <KpiComparisonCard icon={<Scale />} title="Peso Médio Carga" unit="ton" actual={dadosAtuais.pesoMedio} goal={metas.pesoMedio} higherIsBetter={false} />
                    <KpiComparisonCard icon={<TrendingUp />} title="Inércia" unit="%" actual={dadosAtuais.inerciaPct} goal={metas.inerciaPct} higherIsBetter={true} />
                    <KpiComparisonCard icon={<Droplets />} title="Marcha Lenta" unit="%" actual={dadosAtuais.marchaLentaPct} goal={metas.marchaLentaPct} higherIsBetter={false} />
                    <KpiComparisonCard icon={<Star />} title="Freadas Bruscas" unit="/100km" actual={dadosAtuais.freadasBruscas} goal={metas.freadasBruscas} higherIsBetter={false} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* CARD ATUALIZADO para mostrar Litros */}
                    <ResultCard icon={<Droplets />} title="Economia Anual (Litros)" value={resultados.economiaAnualLitros > 0 ? resultados.economiaAnualLitros.toLocaleString('pt-BR', {maximumFractionDigits: 0}) + ' L' : '0 L'} color="#0284c7" />
                    <ResultCard icon={<TrendingUp />} title="Potencial de Economia" value={`${resultados.economiaPercentual > 0 ? resultados.economiaPercentual.toFixed(1) : '0.0'}%`} color="#16a34a" />
                    <ResultCard icon={<DollarSign />} title="Economia Anual (R$)" value={(resultados.economia12Meses).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL', minimumFractionDigits: 0})} color="#16a34a" />
                    <ResultCard icon={<Leaf />} title="Redução de CO₂" value={resultados.reducaoCO2 > 0 ? resultados.reducaoCO2.toFixed(2) : '0.00'} color="#16a34a" />
                    <ResultCard icon={<Star />} title="Nota de Desempenho (Meta)" value={resultados.notaMeta} color="#facc15" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FinancialCard period="Economia em 1 Mês" savingValue={resultados.economia1Mes} />
                    <FinancialCard period="Projeção em 3 Meses" savingValue={resultados.economia3Meses} />
                    <FinancialCard period="Projeção em 6 Meses" savingValue={resultados.economia6Meses} />
                    <FinancialCard period="Projeção em 12 Meses" savingValue={resultados.economia12Meses} />
                </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200" style={{ height: `${graphHeight}px` }}>
               <h2 className="text-lg font-semibold text-gray-800 mb-2">Projeção de Economia (Mensal e Acumulada)</h2>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={resultados.projecao} margin={{ top: 30, right: 30, left: 0, bottom: 5 }}>
                     <defs>
                        <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#c4b5fd" stopOpacity={0.4}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false}/>
                     <XAxis dataKey="mes" stroke="#6b7280" tickLine={false} axisLine={false} />
                     <YAxis stroke="#6b7280" tickLine={false} axisLine={false} tick={false} />
                     <Tooltip content={<CustomCombinedTooltip />} />
                     <Bar dataKey="Economia Mensal (R$)" fill="url(#colorBar)" name="Economia do Mês" radius={[4, 4, 0, 0]}>
                        <LabelList 
                            dataKey="Economia Mensal (R$)" 
                            position="top" 
                            formatter={(value: any) => {
                                if (typeof value === 'number' && value > 0) {
                                    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value)
                                }
                                return '';
                            }}
                            style={{ fill: '#6d28d9', fontWeight: 'bold' }}
                        />
                     </Bar>
                     <Line type="monotone" dataKey="Economia Acumulada (R$)" stroke="#16a34a" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Economia Acumulada" />
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}