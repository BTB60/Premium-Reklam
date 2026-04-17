// 🧠 ОРКЕСТРАТОР: Плоская структура + гарантия работы всех методов
// Совместимость: 
//   - Именованные: import { authApi } from "@/lib/authApi"
//   - Default: import authApi from "@/lib/authApi"
//   - Прямые: import { getCurrentUser } from "@/lib/authApi"

import { authApi as _authApi } from "./auth";
import { productApi as _productApi } from "./products";
import { orderApi as _orderApi } from "./orders";
import { announcementApi as _announcementApi } from "./announcements";
import { 
  getCurrentUser as _getCurrentUser,
  saveCurrentUser as _saveCurrentUser,
  logoutUser as _logoutUser,
  mapRole as _mapRole
} from "./config";
import { calculateLineTotal, calculateOrderTotals } from "./calculations";

// ✅ Именованные экспорты (для существующего кода)
export { _authApi as authApi };
export { _productApi as productApi };
export { _orderApi as orderApi };
export { _announcementApi as announcementApi };
export { calculateLineTotal, calculateOrderTotals };
export { _getCurrentUser as getCurrentUser };
export { _saveCurrentUser as saveCurrentUser };
export { _logoutUser as logoutUser };
export { _mapRole as mapRole };
export type { UserData, Product, Order, OrderItem, OrderSummary, Notification } from "./types";

// ✅ Default export — плоская структура ВСЕХ методов
export default {
  // === AUTH ===
  register: _authApi.register,
  login: _authApi.login,
  getAllUsers: _authApi.getAllUsers,
  getCurrentUser: _getCurrentUser,  // ✅ Прямая ссылка на функцию из config
  saveCurrentUser: _saveCurrentUser,
  logout: _logoutUser,
  forgotPassword: _authApi.forgotPassword,
  resetPassword: _authApi.resetPassword,
  mapRole: _mapRole,

  // === PRODUCTS ===
  getAllProducts: _productApi.getAll,
  getProductById: _productApi.getById,
  createProduct: _productApi.create,
  updateProduct: _productApi.update,
  deleteProduct: _productApi.delete,

  // === ORDERS ===
  getMyOrders: _orderApi.getMyOrders,
  getAllOrders: _orderApi.getAll,
  getOrderById: _orderApi.getById,
  createOrder: _orderApi.create,
  updateOrderStatus: _orderApi.updateStatus,
  deleteOrder: _orderApi.delete,
  applyBonus: _orderApi.applyBonusToOrder,

  // === ANNOUNCEMENTS ===
  getActiveAnnouncements: _announcementApi.getActive,
  getAllAnnouncements: _announcementApi.getAll,
  createAnnouncement: _announcementApi.create,
  updateAnnouncement: _announcementApi.update,
  deleteAnnouncement: _announcementApi.delete,

  // === UTILS ===
  calculateLineTotal,
  calculateOrderTotals,

  // === Группировка по модулям (для вложенного доступа) ===
  auth: _authApi,
  products: _productApi,
  orders: _orderApi,
  announcements: _announcementApi,
};