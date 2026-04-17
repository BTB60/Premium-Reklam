import { BonusTransaction, Payment, Message, Favorite, ReferralRecord, PromoCode } from "./types";
import { getFromStorage, saveToStorage } from "./storage";
import { auth } from "./auth";

const BONUS_KEY = "decor_bonus_transactions";
const PAYMENTS_KEY = "decor_payments";
const MESSAGES_KEY = "decor_messages";
const FAVORITES_KEY = "decor_favorites";
const REFERRALS_KEY = "decor_referrals";
const PROMO_CODES_KEY = "decor_promo_codes";
const USED_PROMOS_KEY = "decor_used_promos";

// Bonus
function getBonusTransactions(): BonusTransaction[] {
  return getFromStorage<BonusTransaction[]>(BONUS_KEY, []);
}
function saveBonusTransactions(transactions: BonusTransaction[]) {
  saveToStorage(BONUS_KEY, transactions);
}

export const bonus = {
  getByUserId(userId: string): BonusTransaction[] {
    return getBonusTransactions().filter(t => t.userId === userId);
  },
  getBalance(userId: string): number {
    return this.getByUserId(userId).reduce((sum, t) => 
      t.type === "earned" || t.type === "bonus" ? sum + t.points : sum - t.points, 0);
  },
  addTransaction(userId: string, type: BonusTransaction["type"], points: number, description: string, orderId?: string) {
    const transaction: BonusTransaction = {
      id: Date.now().toString(), userId, type, points, description, orderId,
      createdAt: new Date().toISOString(),
    };
    const all = getBonusTransactions();
    all.push(transaction);
    saveBonusTransactions(all);
    
    const users = auth.getAllUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      const totalEarned = this.getByUserId(userId)
        .filter(t => t.type === "earned" || t.type === "bonus")
        .reduce((sum, t) => sum + t.points, 0);
      const tier = totalEarned >= 5000 ? "platinum" : totalEarned >= 2000 ? "gold" : totalEarned >= 500 ? "silver" : "bronze";
      auth.update(userId, { bonusPoints: this.getBalance(userId), bonusTier: tier });
    }
    return transaction;
  },
  getTierBenefits(tier: "bronze" | "silver" | "gold" | "platinum") {
    const map = { bronze: { discount: 0, name: "Bronze" }, silver: { discount: 0.05, name: "Silver" }, gold: { discount: 0.10, name: "Gold" }, platinum: { discount: 0.15, name: "Platinum" } };
    return map[tier];
  },
};

// Payments
function getPayments(): Payment[] {
  return getFromStorage<Payment[]>(PAYMENTS_KEY, []);
}
function savePayments(payments: Payment[]) {
  saveToStorage(PAYMENTS_KEY, payments);
}

export const payments = {
  getAll(): Payment[] { return getPayments(); },
  getByUserId(userId: string): Payment[] { return getPayments().filter(p => p.userId === userId); },
  getBalance(userId: string): number {
    return this.getByUserId(userId).reduce((sum, p) => 
      p.type === "payment" || p.type === "refund" ? sum + p.amount : sum - p.amount, 0);
  },
  getDebt(userId: string): number {
    const balance = this.getBalance(userId);
    return balance < 0 ? Math.abs(balance) : 0;
  },
  create(payment: Omit<Payment, "id" | "createdAt">): Payment {
    const newPayment: Payment = { ...payment, id: Date.now().toString(), createdAt: new Date().toISOString() };
    const all = getPayments();
    all.push(newPayment);
    savePayments(all);
    return newPayment;
  },
};

// Messages
function getMessages(): Message[] {
  return getFromStorage<Message[]>(MESSAGES_KEY, []);
}
function saveMessages(messages: Message[]) {
  saveToStorage(MESSAGES_KEY, messages);
}

export const messages = {
  getAll(): Message[] { return getMessages(); },
  getConversation(userId1: string, userId2: string): Message[] {
    return getMessages().filter(m => 
      (m.senderId === userId1 && m.receiverId === userId2) ||
      (m.senderId === userId2 && m.receiverId === userId1)
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },
  getUnreadCount(userId: string): number {
    return getMessages().filter(m => m.receiverId === userId && !m.isRead).length;
  },
  send(senderId: string, receiverId: string, content: string): Message {
    const message: Message = {
      id: Date.now().toString(), senderId, receiverId, content, isRead: false,
      createdAt: new Date().toISOString(),
    };
    const all = getMessages();
    all.push(message);
    saveMessages(all);
    return message;
  },
  markAsRead(messageId: string): void {
    const all = getMessages();
    const index = all.findIndex(m => m.id === messageId);
    if (index !== -1) { all[index].isRead = true; saveMessages(all); }
  },
  markAllAsRead(receiverId: string): void {
    const all = getMessages().map(m => 
      m.receiverId === receiverId && !m.isRead ? { ...m, isRead: true } : m
    );
    saveMessages(all);
  },
};

// Favorites
function getFavorites(): Favorite[] {
  return getFromStorage<Favorite[]>(FAVORITES_KEY, []);
}
function saveFavorites(favorites: Favorite[]) {
  saveToStorage(FAVORITES_KEY, favorites);
}

export const favorites = {
  getByUserId(userId: string): Favorite[] {
    return getFavorites().filter(f => f.userId === userId);
  },
  isFavorite(userId: string, productId: string): boolean {
    return getFavorites().some(f => f.userId === userId && f.productId === productId);
  },
  add(userId: string, productId: string, productName: string, productPrice: number): Favorite {
    const fav: Favorite = {
      id: Date.now().toString(), userId, productId, productName, productPrice,
      createdAt: new Date().toISOString(),
    };
    const all = getFavorites();
    all.push(fav);
    saveFavorites(all);
    return fav;
  },
  remove(userId: string, productId: string): boolean {
    const all = getFavorites().filter(f => !(f.userId === userId && f.productId === productId));
    if (all.length === getFavorites().length) return false;
    saveFavorites(all);
    return true;
  },
  toggle(userId: string, productId: string, productName: string, productPrice: number): boolean {
    return this.isFavorite(userId, productId) 
      ? this.remove(userId, productId) 
      : (this.add(userId, productId, productName, productPrice), true);
  },
};

// Referrals
function getReferrals(): ReferralRecord[] {
  return getFromStorage<ReferralRecord[]>(REFERRALS_KEY, []);
}
function saveReferrals(referrals: ReferralRecord[]) {
  saveToStorage(REFERRALS_KEY, referrals);
}

export const referrals = {
  getAll(): ReferralRecord[] { return getReferrals(); },
  getByReferrerId(referrerId: string): ReferralRecord[] {
    return getReferrals().filter(r => r.referrerId === referrerId);
  },
  getStats(referrerId: string) {
    const userReferrals = this.getByReferrerId(referrerId);
    return {
      total: userReferrals.length,
      completed: userReferrals.filter(r => r.status === "completed").length,
      pending: userReferrals.filter(r => r.status === "pending").length,
      totalBonus: userReferrals.filter(r => r.status === "completed").reduce((sum, r) => sum + r.bonusPoints, 0),
    };
  },
  create(referrerId: string, referredId: string, referredName: string): ReferralRecord {
    const newRef: ReferralRecord = {
      id: Date.now().toString(), referrerId, referredId, referredName,
      status: "pending", bonusPoints: 100, createdAt: new Date().toISOString(),
    };
    const all = getReferrals();
    all.push(newRef);
    saveReferrals(all);
    return newRef;
  },
  complete(id: string): ReferralRecord | null {
    const all = getReferrals();
    const index = all.findIndex(r => r.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], status: "completed", completedAt: new Date().toISOString() };
    saveReferrals(all);
    return all[index];
  },
};

// Promo Codes
function getPromoCodes(): PromoCode[] {
  const raw = getFromStorage<PromoCode[]>(PROMO_CODES_KEY, null);
  if (raw) return raw;
  const defaults: PromoCode[] = [
    { id: "1", code: "PREMIUM20", description: "İlk sifarişə 20% endirim", discountType: "percentage", discountValue: 20, minOrderAmount: 50, maxUses: 100, usedCount: 0, expiresAt: new Date(Date.now() + 30*24*60*60*1000).toISOString(), isActive: true, createdAt: new Date().toISOString() },
    { id: "2", code: "WELCOME10", description: "Xoş gəldin 10 AZN endirim", discountType: "fixed", discountValue: 10, minOrderAmount: 30, maxUses: 200, usedCount: 0, expiresAt: new Date(Date.now() + 60*24*60*60*1000).toISOString(), isActive: true, createdAt: new Date().toISOString() },
  ];
  saveToStorage(PROMO_CODES_KEY, defaults);
  return defaults;
}
function savePromoCodes(codes: PromoCode[]) { saveToStorage(PROMO_CODES_KEY, codes); }
function getUsedPromos(): { userId: string; promoId: string; usedAt: string }[] {
  return getFromStorage<{ userId: string; promoId: string; usedAt: string }[]>(USED_PROMOS_KEY, []);
}
function saveUsedPromos(used: { userId: string; promoId: string; usedAt: string }[]) {
  saveToStorage(USED_PROMOS_KEY, used);
}

export const promoCodes = {
  getAll(): PromoCode[] {
    return getPromoCodes().filter(c => c.isActive && new Date(c.expiresAt) > new Date());
  },
  getByCode(code: string): PromoCode | undefined {
    return this.getAll().find(c => c.code.toUpperCase() === code.toUpperCase());
  },
  validate(code: string, userId: string, orderAmount: number): { valid: boolean; message: string; discount?: number } {
    const promo = this.getByCode(code);
    if (!promo) return { valid: false, message: "Promo kod tapılmadı" };
    if (orderAmount < promo.minOrderAmount) return { valid: false, message: `Minimum sifariş məbləği ${promo.minOrderAmount} AZN olmalıdır` };
    if (promo.usedCount >= promo.maxUses) return { valid: false, message: "Bu kodun istifadə limiti bitib" };
    if (getUsedPromos().some(u => u.userId === userId && u.promoId === promo.id)) return { valid: false, message: "Siz bu kodu artıq istifadə etmisiniz" };
    const discount = promo.discountType === "percentage" ? orderAmount * (promo.discountValue / 100) : promo.discountValue;
    return { valid: true, message: "Kod aktivləşdirildi", discount };
  },
  apply(code: string, userId: string): boolean {
    const promo = this.getByCode(code);
    if (!promo) return false;
    const all = getPromoCodes();
    const index = all.findIndex(c => c.id === promo.id);
    if (index === -1) return false;
    all[index].usedCount++;
    savePromoCodes(all);
    const used = getUsedPromos();
    used.push({ userId, promoId: promo.id, usedAt: new Date().toISOString() });
    saveUsedPromos(used);
    return true;
  },
};