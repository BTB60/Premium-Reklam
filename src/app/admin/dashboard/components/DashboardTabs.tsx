"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ActiveTab } from "./types";

// Импорт компонентов
import StatsCards from "./StatsCards";
import UsersTable from "./UsersTable";
import OrdersTable from "./OrdersTable";
import ShopsManager from "./ShopsManager";
import ElanManager from "./ElanManager";
import NotificationsList from "./NotificationsList";
import AnalyticsDashboard from "./AnalyticsDashboard";
import ProductsManager from "./ProductsManager";
import FinanceDashboard from "./FinanceDashboard";
import InventoryManager from "./InventoryManager";
import WorkerTasksManager from "./WorkerTasksManager";
import SupportManager from "./SupportManager";
import SettingsManager from "./SettingsManager";
import AccessSettingsManager from "./AccessSettingsManager";

interface DashboardTabsProps {
  activeTab: ActiveTab;
}

export default function DashboardTabs({ activeTab }: DashboardTabsProps) {
  return (
    <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {activeTab === "dashboard" && <StatsCards />}
          {activeTab === "users" && <UsersTable />}
          {activeTab === "orders" && <OrdersTable />}
          {activeTab === "shops" && <ShopsManager />}
          {activeTab === "elan" && <ElanManager />}
          {activeTab === "notifications" && <NotificationsList />}
          {activeTab === "analytics" && <AnalyticsDashboard />}
          {activeTab === "products" && <ProductsManager />}
          {activeTab === "finance" && <FinanceDashboard />}
          {activeTab === "inventory" && <InventoryManager />}
          {activeTab === "workerTasks" && <WorkerTasksManager />}
          {activeTab === "support" && <SupportManager />}
          {activeTab === "settings" && <SettingsManager />}
          {activeTab === "accessSettings" && <AccessSettingsManager />}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}