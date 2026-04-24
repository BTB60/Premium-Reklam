import { SystemSettings, Task, Material, FinancialTransaction, CalendarEvent } from "./types";
import { getFromStorage, saveToStorage } from "./storage";

const SETTINGS_KEY = "decor_settings";
const TASKS_KEY = "decor_tasks";
const MATERIALS_KEY = "decor_materials";
const FINANCE_KEY = "decor_finance";
const CALENDAR_KEY = "decor_calendar";

const DEFAULT_SETTINGS: SystemSettings = {
  id: "default",
  unitPricePerSqm: 5,
  productDiscounts: { banner: 0, vinyl: 0, poster: 0, canvas: 0, oracal: 0 },
  monthlyBonus500: 5,
  monthlyBonus1000: 10,
  loyaltyBonusEnabled: true,
  updatedAt: new Date().toISOString()
};

// Settings
export const settings = {
  get(): SystemSettings {
    const raw = getFromStorage<SystemSettings | null>(SETTINGS_KEY, null);
    return raw ? { ...DEFAULT_SETTINGS, ...raw } : DEFAULT_SETTINGS;
  },
  update(updates: Partial<Omit<SystemSettings, "id" | "updatedAt">>): SystemSettings {
    const current = this.get();
    const updated: SystemSettings = { ...current, ...updates, updatedAt: new Date().toISOString() };
    saveToStorage(SETTINGS_KEY, updated);
    return updated;
  },
  reset(): SystemSettings {
    saveToStorage(SETTINGS_KEY, DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
};

// Tasks
function getTasks(): Task[] { return getFromStorage<Task[]>(TASKS_KEY, []); }
function saveTasks(tasks: Task[]) { saveToStorage(TASKS_KEY, tasks); }

export const tasks = {
  getAll(): Task[] { return getTasks(); },
  getByDecoratorId(decoratorId: string): Task[] { return getTasks().filter(t => t.decoratorId === decoratorId); },
  getById(id: string): Task | undefined { return getTasks().find(t => t.id === id); },
  create(task: Omit<Task, "id" | "createdAt" | "status">): Task {
    const newTask: Task = { ...task, id: Date.now().toString(), status: "pending", createdAt: new Date().toISOString() };
    const all = getTasks();
    all.push(newTask);
    saveTasks(all);
    return newTask;
  },
  updateStatus(id: string, status: Task["status"]): void {
    const all = getTasks();
    const index = all.findIndex(t => t.id === id);
    if (index !== -1) {
      all[index] = { ...all[index], status, ...(status === "completed" && { completedAt: new Date().toISOString() }) };
      saveTasks(all);
    }
  },
  delete(id: string): void {
    saveTasks(getTasks().filter(t => t.id !== id));
  }
};

// Inventory
function getMaterials(): Material[] {
  const raw = getFromStorage<Material[]>(MATERIALS_KEY, null);
  if (raw) return raw;
  const defaults: Material[] = [
    { id: "1", name: "Vinil Banner 440g", category: "Banner", unit: "m²", quantity: 500, minQuantity: 50, unitPrice: 8, costPrice: 5, supplier: "Oriflame", lastRestocked: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: "2", name: "Orakal 641", category: "Plenka", unit: "metr", quantity: 200, minQuantity: 30, unitPrice: 3, costPrice: 1.5, supplier: "Oriflame", lastRestocked: new Date().toISOString(), createdAt: new Date().toISOString() },
  ];
  saveToStorage(MATERIALS_KEY, defaults);
  return defaults;
}
function saveMaterials(materials: Material[]) { saveToStorage(MATERIALS_KEY, materials); }

export const inventory = {
  getAll(): Material[] { return getMaterials(); },
  getLowStock(): Material[] { return getMaterials().filter(m => m.quantity <= m.minQuantity); },
  getByCategory(category: string): Material[] { return getMaterials().filter(m => m.category === category); },
  
  create(material: Omit<Material, "id" | "createdAt" | "lastRestocked">): Material {
    const newMat: Material = { 
      ...material, 
      id: Date.now().toString(), 
      lastRestocked: new Date().toISOString(), 
      createdAt: new Date().toISOString(),
      // ✅ Нормализация costPrice: если не передано → 0
      costPrice: material.costPrice !== undefined ? Number(material.costPrice) : 0,
    };
    const all = getMaterials();
    all.push(newMat);
    saveMaterials(all);
    return newMat;
  },
  
  update(id: string, updates: Partial<Material>): Material | null {
    const all = getMaterials();
    const index = all.findIndex(m => m.id === id);
    if (index === -1) return null;
    
    // ✅ Если обновляем costPrice — приводим к числу
    const updated = { 
      ...all[index], 
      ...updates,
      costPrice: updates.costPrice !== undefined ? Number(updates.costPrice) : all[index].costPrice,
    };
    all[index] = updated;
    saveMaterials(all);
    return updated;
  },
  
  delete(id: string): boolean {
    const all = getMaterials().filter(m => m.id !== id);
    if (all.length === getMaterials().length) return false;
    saveMaterials(all);
    return true;
  },
  
  restock(id: string, amount: number): Material | null {
    const all = getMaterials();
    const index = all.findIndex(m => m.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], quantity: all[index].quantity + amount, lastRestocked: new Date().toISOString() };
    saveMaterials(all);
    return all[index];
  },
};

// Finance
function getFinancialTransactions(): FinancialTransaction[] { return getFromStorage<FinancialTransaction[]>(FINANCE_KEY, []); }
function saveFinancialTransactions(transactions: FinancialTransaction[]) { saveToStorage(FINANCE_KEY, transactions); }

export const finance = {
  getAll(): FinancialTransaction[] { return getFinancialTransactions(); },
  getByDateRange(start: string, end: string): FinancialTransaction[] {
    return getFinancialTransactions().filter(t => t.date >= start && t.date <= end);
  },
  getByType(type: "income" | "expense"): FinancialTransaction[] {
    return getFinancialTransactions().filter(t => t.type === type);
  },
  getSummary(): { income: number; expense: number; balance: number } {
    const all = getFinancialTransactions();
    const income = all.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = all.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  },
  create(transaction: Omit<FinancialTransaction, "id" | "createdAt">): FinancialTransaction {
    const newTx: FinancialTransaction = { ...transaction, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const all = getFinancialTransactions();
    all.push(newTx);
    saveFinancialTransactions(all);
    return newTx;
  },
  update(id: string, updates: Partial<FinancialTransaction>): FinancialTransaction | null {
    const all = getFinancialTransactions();
    const index = all.findIndex(t => t.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    saveFinancialTransactions(all);
    return all[index];
  },
  delete(id: string): boolean {
    const all = getFinancialTransactions().filter(t => t.id !== id);
    if (all.length === getFinancialTransactions().length) return false;
    saveFinancialTransactions(all);
    return true;
  },
};

// Calendar
function getCalendarEvents(): CalendarEvent[] { return getFromStorage<CalendarEvent[]>(CALENDAR_KEY, []); }
function saveCalendarEvents(events: CalendarEvent[]) { saveToStorage(CALENDAR_KEY, events); }

export const calendar = {
  getAll(): CalendarEvent[] { return getCalendarEvents(); },
  getByUserId(userId: string): CalendarEvent[] { return getCalendarEvents().filter(e => e.userId === userId); },
  getByDateRange(start: string, end: string): CalendarEvent[] {
    return getCalendarEvents().filter(e => e.date >= start && e.date <= end);
  },
  create(event: Omit<CalendarEvent, "id" | "createdAt">): CalendarEvent {
    const newEvent: CalendarEvent = { ...event, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const all = getCalendarEvents();
    all.push(newEvent);
    saveCalendarEvents(all);
    return newEvent;
  },
  update(id: string, updates: Partial<CalendarEvent>): CalendarEvent | null {
    const all = getCalendarEvents();
    const index = all.findIndex(e => e.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], ...updates };
    saveCalendarEvents(all);
    return all[index];
  },
  delete(id: string): boolean {
    const all = getCalendarEvents().filter(e => e.id !== id);
    if (all.length === getCalendarEvents().length) return false;
    saveCalendarEvents(all);
    return true;
  },
};