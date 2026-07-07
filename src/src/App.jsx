import React, { useState, useMemo } from 'react';
import { Dumbbell, Utensils, TrendingUp, Settings, AlertCircle, CheckCircle, Calendar, Trash2, Plus, ChevronDown, ChevronRight, BarChart2, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Moved OUTSIDE to prevent React from losing focus on keystrokes
const MeasureInput = ({ label, name, value, unit, onChange }) => (
  <div className="bg-slate-900 rounded-lg border border-slate-700 p-2 focus-within:border-amber-500 transition-colors">
    <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">{label} ({unit})</p>
    <input type="number" name={name} className="w-full bg-transparent text-sm font-bold focus:outline-none text-slate-200" value={value} onChange={onChange} />
  </div>
);

export default function FitnessApp() {
  const [activeTab, setActiveTab] = useState('profile');
  const [system, setSystem] = useState('metric');
  
  const weightUnit = system === 'metric' ? 'kg' : 'lbs';
  const lengthUnit = system === 'metric' ? 'cm' : 'in';
  const today = new Date().toISOString().split('T')[0];
  
  // --- STATE ---
  const [profile, setProfile] = useState({
    name: '', age: '', weight: '', height: '', gender: 'male',
    targetCalories: '', targetProtein: '', targetCarbs: '', targetFat: '',
    neck: '', shoulders: '', chest: '', waist: '', hip: '',
    bicepL: '', bicepR: '', forearmL: '', forearmR: '',
    thighL: '', thighR: '', calfL: '', calfR: ''
  });

  // Nutrition State
  const [meals, setMeals] = useState([]);
  const [nutritionDate, setNutritionDate] = useState(today);
  const [newMeal, setNewMeal] = useState({ name: '', protein: '', carbs: '', fat: '' });

  // Body State
  const [bodyHistory, setBodyHistory] = useState([]);
  const [chartMetric, setChartMetric] = useState('weight');

  // Workout State
  const [workoutSessions, setWorkoutSessions] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null); 
  const [expandedSessions, setExpandedSessions] = useState({});
  const [chartExercise, setChartExercise] = useState('');

  // --- UNIT CONVERSION LOGIC ---
  const toggleSystem = () => {
    const newSystem = system === 'metric' ? 'imperial' : 'metric';
    const weightFactor = newSystem === 'imperial' ? 2.20462 : 1 / 2.20462;
    const lengthFactor = newSystem === 'imperial' ? 1 / 2.54 : 2.54;
    
    const updatedProfile = { ...profile };
    if (updatedProfile.weight) updatedProfile.weight = parseFloat((Number(updatedProfile.weight) * weightFactor).toFixed(2));
    
    const lengthFields = ['height', 'neck', 'shoulders', 'chest', 'waist', 'hip', 'bicepL', 'bicepR', 'forearmL', 'forearmR', 'thighL', 'thighR', 'calfL', 'calfR'];
    lengthFields.forEach(field => {
      if (updatedProfile[field]) updatedProfile[field] = parseFloat((Number(updatedProfile[field]) * lengthFactor).toFixed(2));
    });
    
    setProfile(updatedProfile);
    setSystem(newSystem);
  };

  // --- NUTRITION LOGIC ---
  const calcMacros = (p, c, f) => (Number(p) * 4) + (Number(c) * 4) + (Number(f) * 9);
  const currentMacroCals = calcMacros(profile.targetProtein, profile.targetCarbs, profile.targetFat);
  const targetCals = Number(profile.targetCalories) || 0;
  const calDifference = targetCals - currentMacroCals;
  const hasSetGoals = targetCals > 0;

  const activeMeals = meals.filter(m => m.date === nutritionDate);
  const totals = activeMeals.reduce((acc, m) => ({ cal: acc.cal + m.calories, p: acc.p + m.protein, c: acc.c + m.carbs, f: acc.f + m.fat }), { cal: 0, p: 0, c: 0, f: 0 });

  const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleAddMeal = () => {
    if (!newMeal.name) return;
    const p = parseFloat(newMeal.protein) || 0;
    const c = parseFloat(newMeal.carbs) || 0;
    const f = parseFloat(newMeal.fat) || 0;
    setMeals([{ 
      id: Date.now(), 
      date: nutritionDate, 
      name: newMeal.name, 
      protein: p, 
      carbs: c, 
      fat: f, 
      calories: calcMacros(p, c, f) 
    }, ...meals]);
    setNewMeal({ name: '', protein: '', carbs: '', fat: '' });
  };
  
  const deleteMeal = (id) => setMeals(meals.filter(m => m.id !== id));

  // --- BODY LOGIC ---
  const handleUpdateBody = () => {
    if (!profile.weight) return;
    
    const snapshot = {
      id: Date.now(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: Number(profile.weight) || 0,
      neck: Number(profile.neck) || 0,
      shoulders: Number(profile.shoulders) || 0,
      chest: Number(profile.chest) || 0,
      waist: Number(profile.waist) || 0,
      hip: Number(profile.hip) || 0,
      bicepL: Number(profile.bicepL) || 0,
      bicepR: Number(profile.bicepR) || 0,
      forearmL: Number(profile.forearmL) || 0,
      forearmR: Number(profile.forearmR) || 0,
      thighL: Number(profile.thighL) || 0,
      thighR: Number(profile.thighR) || 0,
      calfL: Number(profile.calfL) || 0,
      calfR: Number(profile.calfR) || 0
    };
    
    setBodyHistory([...bodyHistory, snapshot]);
  };

  const calculateBMR = () => {
    if (!profile.weight || !profile.height || !profile.age) return 0;
    const wKg = system === 'imperial' ? Number(profile.weight) / 2.20462 : Number(profile.weight);
    const hCm = system === 'imperial' ? Number(profile.height) * 2.54 : Number(profile.height);
    let bmr = (10 * wKg) + (6.25 * hCm) - (5 * Number(profile.age));
    return profile.gender === 'male' ? bmr + 5 : bmr - 161;
  };

  const measurementLabels = {
    weight: `Weight (${weightUnit})`, neck: `Neck (${lengthUnit})`, shoulders: `Shoulders (${lengthUnit})`,
    chest: `Chest (${lengthUnit})`, waist: `Waist (${lengthUnit})`, hip: `Hip (${lengthUnit})`,
    bicepL: `Bicep L (${lengthUnit})`, bicepR: `Bicep R (${lengthUnit})`, forearmL: `Forearm L (${lengthUnit})`,
    forearmR: `Forearm R (${lengthUnit})`, thighL: `Thigh L (${lengthUnit})`, thighR: `Thigh R (${lengthUnit})`,
    calfL: `Calf L (${lengthUnit})`, calfR: `Calf R (${lengthUnit})`
  };

  // --- WORKOUT BUILDER LOGIC ---
  const startNewWorkout = () => setActiveWorkout({ id: Date.now(), name: 'New Session', date: today, exercises: [] });
  const addExerciseToWorkout = () => setActiveWorkout({ ...activeWorkout, exercises: [...activeWorkout.exercises, { id: Date.now(), name: '', sets: [{ id: Date.now(), reps: '', weight: '' }] }] });
  const updateExerciseName = (exId, name) => setActiveWorkout({ ...activeWorkout, exercises: activeWorkout.exercises.map(ex => ex.id === exId ? { ...ex, name } : ex) });
  const addSetToExercise = (exId) => setActiveWorkout({ ...activeWorkout, exercises: activeWorkout.exercises.map(ex => ex.id === exId ? { ...ex, sets: [...ex.sets, { id: Date.now(), reps: '', weight: '' }] } : ex) });
  const updateSet = (exId, setId, field, value) => setActiveWorkout({ ...activeWorkout, exercises: activeWorkout.exercises.map(ex => ex.id === exId ? { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) } : ex) });
  const removeSet = (exId, setId) => setActiveWorkout({ ...activeWorkout, exercises: activeWorkout.exercises.map(ex => ex.id === exId ? { ...ex, sets: ex.sets.filter(s => s.id !== setId) } : ex) });
  const removeExercise = (exId) => setActiveWorkout({ ...activeWorkout, exercises: activeWorkout.exercises.filter(ex => ex.id !== exId) });
  const deleteSession = (sessionId) => setWorkoutSessions(workoutSessions.filter(s => s.id !== sessionId));
  const toggleSessionExpand = (id) => setExpandedSessions(prev => ({ ...prev, [id]: !prev[id] }));

  const saveWorkout = () => {
    if (!activeWorkout.name || activeWorkout.exercises.length === 0) return;
    const cleanedExercises = activeWorkout.exercises.map(ex => ({ ...ex, sets: ex.sets.filter(s => s.reps !== '' || s.weight !== '') })).filter(ex => ex.name.trim() !== '' && ex.sets.length > 0);
    if (cleanedExercises.length === 0) { setActiveWorkout(null); return; }
    setWorkoutSessions([{ ...activeWorkout, exercises: cleanedExercises }, ...workoutSessions]);
    setActiveWorkout(null);
  };

  // --- CHART LOGIC ---
  const uniqueExercises = useMemo(() => {
    const names = new Set();
    workoutSessions.forEach(session => session.exercises.forEach(ex => names.add(ex.name.toLowerCase().trim())));
    return Array.from(names).sort();
  }, [workoutSessions]);

  const exerciseChartData = useMemo(() => {
    if (!chartExercise) return [];
    const data = [];
    workoutSessions.slice().reverse().forEach(session => {
      const exMatch = session.exercises.find(ex => ex.name.toLowerCase().trim() === chartExercise);
      if (exMatch) {
        let maxWeight = 0;
        exMatch.sets.forEach(set => { const w = parseFloat(set.weight); if (w > maxWeight) maxWeight = w; });
        if (maxWeight > 0) {
          const shortDate = new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          data.push({ date: shortDate, weight: maxWeight });
        }
      }
    });
    return data;
  }, [chartExercise, workoutSessions]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex justify-center w-full">
      <div className="w-full max-w-md bg-slate-900 shadow-2xl flex flex-col h-screen border-x border-slate-800">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900 flex justify-between items-center shrink-0 z-10">
          <div>
            <h1 className="text-xl font-black text-emerald-400 uppercase tracking-wider">Recomp OS</h1>
            <p className="text-slate-400 text-xs mt-1">{profile.name ? profile.name : 'Welcome, Guest'}</p>
          </div>
          <button onClick={toggleSystem} className="bg-slate-800 text-[10px] font-bold px-3 py-1.5 rounded text-slate-300 hover:text-white transition uppercase border border-slate-700">
            {system === 'metric' ? 'Metric (kg/cm)' : 'Imperial (lbs/in)'}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto flex-1 pb-24">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm space-y-4">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Basic Metrics</p>
                <input type="text" name="name" placeholder="Your Name" className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 text-sm focus:outline-none focus:border-blue-500" value={profile.name} onChange={handleProfileChange} />
                <div className="flex gap-2">
                  <input type="number" name="age" placeholder="Age" className="w-1/3 p-3 bg-slate-900 rounded-lg border border-slate-700 text-sm focus:outline-none" value={profile.age} onChange={handleProfileChange} />
                  <input type="number" name="weight" placeholder={`Wt (${weightUnit})`} className="w-1/3 p-3 bg-slate-900 rounded-lg border border-slate-700 text-sm focus:outline-none" value={profile.weight} onChange={handleProfileChange} />
                  <input type="number" name="height" placeholder={`Ht (${lengthUnit})`} className="w-1/3 p-3 bg-slate-900 rounded-lg border border-slate-700 text-sm focus:outline-none" value={profile.height} onChange={handleProfileChange} />
                </div>
                <select name="gender" className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 text-sm focus:outline-none text-slate-300" value={profile.gender} onChange={handleProfileChange}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm space-y-4">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Macro Balancer</p>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Master Calorie Target</p>
                  <input type="number" name="targetCalories" placeholder="e.g. 2500" className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 text-xl font-black text-emerald-400 focus:outline-none focus:border-emerald-500" value={profile.targetCalories} onChange={handleProfileChange} />
                </div>
                <div className="flex gap-2">
                  <div className="w-1/3"><p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Pro (g)</p><input type="number" name="targetProtein" placeholder="0" className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 text-sm focus:outline-none focus:border-blue-500" value={profile.targetProtein} onChange={handleProfileChange} /></div>
                  <div className="w-1/3"><p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Carb (g)</p><input type="number" name="targetCarbs" placeholder="0" className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 text-sm focus:outline-none focus:border-emerald-500" value={profile.targetCarbs} onChange={handleProfileChange} /></div>
                  <div className="w-1/3"><p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Fat (g)</p><input type="number" name="targetFat" placeholder="0" className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 text-sm focus:outline-none focus:border-amber-500" value={profile.targetFat} onChange={handleProfileChange} /></div>
                </div>

                <div className={`p-4 rounded-lg flex items-center justify-between border ${calDifference === 0 && targetCals > 0 ? 'bg-emerald-900/30 border-emerald-800' : calDifference < 0 ? 'bg-red-900/30 border-red-800' : 'bg-slate-900 border-slate-700'}`}>
                  <div><p className="text-[10px] uppercase font-bold text-slate-400">Current Macros</p><p className="text-xl font-black">{Math.round(currentMacroCals)} <span className="text-sm font-normal text-slate-500">kcal</span></p></div>
                  <div className="text-right">
                    {calDifference === 0 && targetCals > 0 && <div className="flex items-center text-emerald-400 gap-1"><CheckCircle size={16}/><span className="text-xs font-bold uppercase">Balanced</span></div>}
                    {calDifference > 0 && targetCals > 0 && <div className="text-slate-300"><span className="text-lg font-black text-emerald-400">+{Math.round(calDifference)}</span><br/><span className="text-[10px] uppercase font-bold text-slate-500">Remaining</span></div>}
                    {calDifference < 0 && targetCals > 0 && <div className="flex flex-col items-end text-red-400"><div className="flex items-center gap-1"><AlertCircle size={14}/><span className="text-lg font-black">{Math.abs(Math.round(calDifference))}</span></div><span className="text-[10px] uppercase font-bold">OVER TARGET</span></div>}
                  </div>
                </div>
                <button onClick={() => { if(hasSetGoals) setActiveTab('nutrition') }} className={`w-full font-black py-3 rounded-lg transition text-sm uppercase tracking-wide ${hasSetGoals ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>Apply Targets</button>
              </div>
            </div>
          )}

          {/* NUTRITION TAB */}
          {activeTab === 'nutrition' && (
            <div className="space-y-6 animate-in fade-in">
              {!hasSetGoals ? (
                <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-sm text-center space-y-4 mt-10">
                  <Utensils size={48} className="mx-auto text-slate-600" />
                  <p className="text-slate-300 font-bold">No Daily Targets Set</p>
                  <button onClick={() => setActiveTab('profile')} className="bg-blue-500 text-white font-bold py-2 px-6 rounded-lg text-sm">Go to Profile</button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Food Diary</p>
                    <div className="flex items-center gap-2 text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                      <Calendar size={16} />
                      <input type="date" className="bg-transparent text-sm font-bold focus:outline-none" value={nutritionDate} onChange={e => setNutritionDate(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Calories</p><p className="text-2xl font-black mt-1">{Math.round(totals.cal)} <span className="text-xs text-slate-500 font-normal">/ {profile.targetCalories}</span></p></div>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Protein</p><p className="text-2xl font-black text-blue-400 mt-1">{Math.round(totals.p)}g <span className="text-xs text-slate-500 font-normal">/ {profile.targetProtein || 0}g</span></p></div>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Carbs</p><p className="text-2xl font-black text-emerald-400 mt-1">{Math.round(totals.c)}g <span className="text-xs text-slate-500 font-normal">/ {profile.targetCarbs || 0}g</span></p></div>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Fat</p><p className="text-2xl font-black text-amber-400 mt-1">{Math.round(totals.f)}g <span className="text-xs text-slate-500 font-normal">/ {profile.targetFat || 0}g</span></p></div>
                  </div>

                  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm space-y-3">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Log Meal for {new Date(nutritionDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    <input type="text" placeholder="Food Name" className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 text-sm" value={newMeal.name} onChange={e => setNewMeal({...newMeal, name: e.target.value})} />
                    <div className="flex gap-2">
                      <input type="number" placeholder="Pro (g)" className="w-1/3 p-3 bg-slate-900 rounded-lg border border-slate-700 focus:outline-none text-sm" value={newMeal.protein} onChange={e => setNewMeal({...newMeal, protein: e.target.value})} />
                      <input type="number" placeholder="Carb (g)" className="w-1/3 p-3 bg-slate-900 rounded-lg border border-slate-700 focus:outline-none text-sm" value={newMeal.carbs} onChange={e => setNewMeal({...newMeal, carbs: e.target.value})} />
                      <input type="number" placeholder="Fat (g)" className="w-1/3 p-3 bg-slate-900 rounded-lg border border-slate-700 focus:outline-none text-sm" value={newMeal.fat} onChange={e => setNewMeal({...newMeal, fat: e.target.value})} />
                    </div>
                    <button onClick={handleAddMeal} className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-3 rounded-lg transition text-sm uppercase tracking-wide">+ Quick Add</button>
                  </div>

                  <div className="space-y-2">
                    {activeMeals.length === 0 && <p className="text-center text-slate-500 text-sm py-4">No meals logged on this date.</p>}
                    {activeMeals.map(meal => (
                      <div key={meal.id} className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm group">
                        <div><p className="font-bold text-sm">{meal.name}</p><p className="text-[11px] text-slate-400 mt-0.5">P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g</p></div>
                        <div className="flex items-center gap-3">
                          <p className="font-black text-emerald-400 text-sm">{Math.round(meal.calories)} kcal</p>
                          <button onClick={() => deleteMeal(meal.id)} className="text-slate-600 hover:text-red-400 transition"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* WORKOUT TAB */}
          {activeTab === 'workout' && (
            <div className="space-y-6 animate-in fade-in">
              {activeWorkout ? (
                <div className="space-y-4">
                  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Session Details</p>
                      <button onClick={() => setActiveWorkout(null)} className="text-xs text-slate-500 hover:text-white">Cancel</button>
                    </div>
                    <input type="text" placeholder="Folder Name (e.g. Leg Day)" className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 text-lg font-black" value={activeWorkout.name} onChange={e => setActiveWorkout({...activeWorkout, name: e.target.value})} />
                    <div className="flex items-center gap-2 text-slate-300 bg-slate-900 px-3 py-2 rounded-lg border border-slate-700 w-max">
                      <Calendar size={16} />
                      <input type="date" className="bg-transparent text-sm font-bold focus:outline-none" value={activeWorkout.date} onChange={e => setActiveWorkout({...activeWorkout, date: e.target.value})} />
                    </div>
                  </div>

                  {activeWorkout.exercises.map((ex, exIndex) => (
                    <div key={ex.id} className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
                      <div className="p-3 bg-slate-800 border-b border-slate-700 flex gap-2">
                        <span className="bg-blue-500 text-white font-black w-8 h-8 flex items-center justify-center rounded-lg">{exIndex + 1}</span>
                        <input type="text" placeholder="Exercise Name..." className="flex-1 bg-transparent font-bold focus:outline-none text-slate-100 placeholder-slate-500" value={ex.name} onChange={e => updateExerciseName(ex.id, e.target.value)} />
                        <button onClick={() => removeExercise(ex.id)} className="text-slate-600 hover:text-red-400 p-2"><Trash2 size={16} /></button>
                      </div>
                      <div className="p-2 bg-slate-900/50 space-y-1">
                        <div className="flex text-[10px] font-bold text-slate-500 uppercase px-2 mb-1">
                          <span className="w-12 text-center">Set</span>
                          <span className="flex-1 text-center">Weight ({weightUnit})</span>
                          <span className="flex-1 text-center">Reps</span>
                          <span className="w-8"></span>
                        </div>
                        {ex.sets.map((set, setIdx) => (
                          <div key={set.id} className="flex gap-2 items-center bg-slate-800 p-1.5 rounded-lg border border-slate-700">
                            <span className="w-10 text-center text-xs font-bold text-slate-400">{setIdx + 1}</span>
                            <input type="number" placeholder="-" className="flex-1 bg-slate-900 p-2 rounded text-center text-sm font-bold focus:outline-none" value={set.weight} onChange={e => updateSet(ex.id, set.id, 'weight', e.target.value)} />
                            <input type="number" placeholder="-" className="flex-1 bg-slate-900 p-2 rounded text-center text-sm font-bold focus:outline-none" value={set.reps} onChange={e => updateSet(ex.id, set.id, 'reps', e.target.value)} />
                            <button onClick={() => removeSet(ex.id, set.id)} className="w-8 flex justify-center text-slate-600 hover:text-red-400"><Trash2 size={14}/></button>
                          </div>
                        ))}
                        <button onClick={() => addSetToExercise(ex.id)} className="w-full text-xs font-bold text-blue-400 hover:bg-slate-800 py-2 rounded-lg transition mt-2">+ Add Set</button>
                      </div>
                    </div>
                  ))}

                  <button onClick={addExerciseToWorkout} className="w-full border-2 border-dashed border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-400 font-bold py-4 rounded-xl transition flex justify-center items-center gap-2">
                    <Plus size={18} /> Add Exercise
                  </button>

                  <button onClick={saveWorkout} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-4 rounded-xl transition uppercase tracking-widest mt-6 shadow-lg shadow-blue-500/20">
                    Finish & Save Session
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={startNewWorkout} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-4 rounded-xl transition flex justify-center items-center gap-2 shadow-lg shadow-blue-500/20">
                    <Plus size={20} /> Start Empty Workout
                  </button>

                  {uniqueExercises.length > 0 && (
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-blue-400 mb-2">
                        <BarChart2 size={18} />
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Exercise Progression</p>
                      </div>
                      <select 
                        className="w-full bg-slate-900 p-2 rounded-lg border border-slate-700 text-sm focus:outline-none text-slate-200 capitalize"
                        value={chartExercise} onChange={e => setChartExercise(e.target.value)}
                      >
                        <option value="">Select an exercise to graph...</option>
                        {uniqueExercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                      </select>
                      
                      {chartExercise && exerciseChartData.length > 0 && (
                        <div className="h-40 w-full mt-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={exerciseChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                              <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={10} domain={['dataMin - 5', 'dataMax + 5']} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                              <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 mt-6">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Session History</p>
                    {workoutSessions.map(session => {
                      const isExpanded = expandedSessions[session.id];
                      return (
                        <div key={session.id} className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden transition-all">
                          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-700/50" onClick={() => toggleSessionExpand(session.id)}>
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown size={18} className="text-slate-400"/> : <ChevronRight size={18} className="text-slate-400"/>}
                              <div>
                                <p className="font-black text-slate-200">{session.name}</p>
                                <p className="text-[11px] text-slate-400 font-medium">{new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} • {session.exercises.length} Exercises</p>
                              </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }} className="text-slate-600 hover:text-red-400 p-2 rounded-full"><Trash2 size={16} /></button>
                          </div>
                          
                          {isExpanded && (
                            <div className="p-3 bg-slate-900/50 border-t border-slate-700 space-y-3">
                              {session.exercises.map(ex => (
                                <div key={ex.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700/50">
                                  <p className="font-bold text-sm text-blue-400 mb-2">{ex.name}</p>
                                  <div className="space-y-1">
                                    {ex.sets.map((set, i) => (
                                      <div key={set.id} className="flex text-xs text-slate-300 items-center">
                                        <span className="w-8 font-bold text-slate-500">{i+1}</span>
                                        <span className="flex-1">{set.weight ? `${set.weight} ${weightUnit}` : '-'}</span>
                                        <span className="flex-1">{set.reps ? `${set.reps} reps` : '-'}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* BODY & MEASUREMENTS TAB */}
          {activeTab === 'body' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Log Metrics & Tape</p>
                  <button onClick={handleUpdateBody} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-1.5 px-4 rounded text-xs uppercase tracking-wide transition">Save History</button>
                </div>
                
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex items-center justify-between focus-within:border-amber-500 transition-colors">
                  <span className="text-[10px] text-slate-400 font-bold uppercase w-24">Weight ({weightUnit})</span>
                  <input type="number" name="weight" className="flex-1 bg-transparent text-xl font-black text-right focus:outline-none text-white" value={profile.weight} onChange={handleProfileChange} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <MeasureInput label="Neck" name="neck" value={profile.neck} unit={lengthUnit} onChange={handleProfileChange} />
                  <MeasureInput label="Shoulders" name="shoulders" value={profile.shoulders} unit={lengthUnit} onChange={handleProfileChange} />
                  <MeasureInput label="Chest" name="chest" value={profile.chest} unit={lengthUnit} onChange={handleProfileChange} />
                  <MeasureInput label="Waist" name="waist" value={profile.waist} unit={lengthUnit} onChange={handleProfileChange} />
                  <MeasureInput label="Hip" name="hip" value={profile.hip} unit={lengthUnit} onChange={handleProfileChange} />
                  
                  <div className="col-span-2 border-t border-slate-700/50 my-1 pt-1"></div>
                  
                  <MeasureInput label="Bicep (L)" name="bicepL" value={profile.bicepL} unit={lengthUnit} onChange={handleProfileChange} />
                  <MeasureInput label="Bicep (R)" name="bicepR" value={profile.bicepR} unit={lengthUnit} onChange={handleProfileChange} />
                  <MeasureInput label="Forearm (L)" name="forearmL" value={profile.forearmL} unit={lengthUnit} onChange={handleProfileChange} />
                  <MeasureInput label="Forearm (R)" name="forearmR" value={profile.forearmR} unit={lengthUnit} onChange={handleProfileChange} />
                  <MeasureInput label="Thigh (L)" name="thighL" value={profile.thighL} unit={lengthUnit} onChange={handleProfileChange} />
                  <MeasureInput label="Thigh (R)" name="thighR" value={profile.thighR} unit={lengthUnit} onChange={handleProfileChange} />
                  <MeasureInput label="Calf (L)" name="calfL" value={profile.calfL} unit={lengthUnit} onChange={handleProfileChange} />
                  <MeasureInput label="Calf (R)" name="calfR" value={profile.calfR} unit={lengthUnit} onChange={handleProfileChange} />
                </div>
              </div>

              {bodyHistory.length > 0 && (
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 mb-2">
                    <Activity size={18} />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Measurement Trends</p>
                  </div>
                  
                  <select 
                    className="w-full bg-slate-900 p-2 rounded-lg border border-slate-700 text-sm font-bold focus:outline-none text-slate-200"
                    value={chartMetric} onChange={e => setChartMetric(e.target.value)}
                  >
                    {Object.entries(measurementLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>

                  <div className="h-48 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={bodyHistory.filter(entry => entry[chartMetric] > 0)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} domain={['dataMin - 2', 'dataMax + 2']} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                        <Line type="monotone" dataKey={chartMetric} stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Metabolism Engine</p>
                {calculateBMR() > 0 ? (
                  <>
                    <div className="flex justify-between border-b border-slate-700 pb-3">
                      <div><p className="text-sm font-bold text-slate-200">Base BMR</p><p className="text-[10px] text-slate-500">Calories burned at rest</p></div>
                      <span className="font-black text-lg">{Math.round(calculateBMR())} kcal</span>
                    </div>
                    <div className="flex justify-between pt-3">
                      <div><p className="text-sm font-bold text-emerald-400">Est. TDEE</p><p className="text-[10px] text-slate-500">Includes active training</p></div>
                      <span className="font-black text-lg text-emerald-400">{Math.round(calculateBMR() * 1.55)} kcal</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Enter age, weight, and height in the Profile tab to calculate your metabolic rate.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Navbar */}
        <div className="absolute bottom-0 w-full max-w-md flex bg-slate-950 border-t border-slate-800 pb-safe z-20">
          <button onClick={() => setActiveTab('profile')} className={`flex-1 flex flex-col items-center py-4 transition ${activeTab === 'profile' ? 'text-slate-100' : 'text-slate-600 hover:text-slate-400'}`}>
            <Settings size={22} className={activeTab === 'profile' ? 'stroke-[2.5px]' : 'stroke-2'} />
            <span className="text-[10px] font-black uppercase mt-1.5 tracking-wider">Profile</span>
          </button>
          <button onClick={() => setActiveTab('nutrition')} className={`flex-1 flex flex-col items-center py-4 transition ${activeTab === 'nutrition' ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}>
            <Utensils size={22} className={activeTab === 'nutrition' ? 'stroke-[2.5px]' : 'stroke-2'} />
            <span className="text-[10px] font-black uppercase mt-1.5 tracking-wider">Food</span>
          </button>
          <button onClick={() => setActiveTab('workout')} className={`flex-1 flex flex-col items-center py-4 transition ${activeTab === 'workout' ? 'text-blue-400' : 'text-slate-600 hover:text-slate-400'}`}>
            <Dumbbell size={22} className={activeTab === 'workout' ? 'stroke-[2.5px]' : 'stroke-2'} />
            <span className="text-[10px] font-black uppercase mt-1.5 tracking-wider">Train</span>
          </button>
          <button onClick={() => setActiveTab('body')} className={`flex-1 flex flex-col items-center py-4 transition ${activeTab === 'body' ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'}`}>
            <TrendingUp size={22} className={activeTab === 'body' ? 'stroke-[2.5px]' : 'stroke-2'} />
            <span className="text-[10px] font-black uppercase mt-1.5 tracking-wider">Body</span>
          </button>
        </div>
      </div>
    </div>
  );
}
