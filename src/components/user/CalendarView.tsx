"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { calendar, type CalendarEvent, type Order } from "@/lib/db";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Truck,
  Clock,
  AlertCircle,
  Plus,
  X,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { az } from "date-fns/locale";

interface CalendarViewProps {
  events: CalendarEvent[];
  orders: Order[];
  userId: string;
}

const EVENT_COLORS = {
  delivery: "bg-blue-500",
  meeting: "bg-purple-500",
  deadline: "bg-red-500",
  other: "bg-gray-500",
};

const EVENT_NAMES = {
  delivery: "Çatdırılma",
  meeting: "Görüş",
  deadline: "Son tarix",
  other: "Digər",
};

export function CalendarView({ events, orders, userId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "other" as CalendarEvent["type"],
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((e) => isSameDay(new Date(e.date), date));
  };

  const getOrdersForDate = (date: Date) => {
    return orders.filter((o) => {
      const orderDate = o.createdAt
        ? new Date(o.createdAt)
        : null;
      return orderDate && isSameDay(orderDate, date);
    });
  };

  const handleAddEvent = () => {
    if (!selectedDate || !formData.title) return;
    calendar.create({
      userId,
      title: formData.title,
      description: formData.description,
      date: selectedDate.toISOString().split("T")[0],
      type: formData.type,
    });
    setShowAddForm(false);
    setFormData({ title: "", description: "", type: "other" });
    window.location.reload();
  };

  const weekDays = ["B.E", "Ç.A", "Ç", "C.A", "C", "Ş", "B"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold capitalize">
            {format(currentDate, "MMMM yyyy", { locale: az })}
          </h2>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <Button
          onClick={() => {
            setSelectedDate(new Date());
            setShowAddForm(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Təqvimə əlavə et
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d) => (
            <div
              key={d}
              className="p-2 text-center text-sm font-medium text-gray-500"
            >
              {d}
            </div>
          ))}
          {days.map((d, idx) => {
            const dayEvents = getEventsForDate(d);
            const dayOrders = getOrdersForDate(d);
            const isSelected = selectedDate && isSameDay(d, selectedDate);
            const isCurrentMonth = isSameMonth(d, currentDate);

            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedDate(d);
                  setShowAddForm(false);
                }}
                className={`p-2 min-h-[80px] border rounded-lg text-left transition-colors ${
                  isSelected
                    ? "border-[#D90429] bg-[#D90429]/5"
                    : "border-gray-100 hover:bg-gray-50"
                } ${!isCurrentMonth ? "bg-gray-50/50" : ""}`}
              >
                <span
                  className={`text-sm ${
                    isSameDay(d, new Date())
                      ? "font-bold text-[#D90429]"
                      : "text-gray-700"
                  }`}
                >
                  {format(d, "d")}
                </span>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      className={`h-1.5 rounded-full ${EVENT_COLORS[e.type]}`}
                    />
                  ))}
                  {dayOrders.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Truck className="w-3 h-3" />
                      {dayOrders.length}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">
              {format(selectedDate, "d MMMM yyyy", { locale: az })}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Orders */}
          {getOrdersForDate(selectedDate).length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                Çatdırılma gözlənilir
              </h4>
              {getOrdersForDate(selectedDate).map((o) => (
                <div
                  key={o.id}
                  className="p-3 bg-blue-50 rounded-lg flex items-center gap-3"
                >
                  <Truck className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Sifariş #{o.id.slice(-4)}</p>
                    <p className="text-sm text-gray-500">
                      {o.items.length} məhsul • {o.finalTotal.toFixed(2)} AZN
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Events */}
          {getEventsForDate(selectedDate).length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-500">Hadisələr</h4>
              {getEventsForDate(selectedDate).map((e) => (
                <div
                  key={e.id}
                  className={`p-3 rounded-lg border-l-4 ${EVENT_COLORS[e.type].replace(
                    "bg-",
                    "border-"
                  )} bg-gray-50`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${EVENT_COLORS[e.type]}`}
                    />
                    <span className="text-xs text-gray-500">
                      {EVENT_NAMES[e.type]}
                    </span>
                  </div>
                  <p className="font-medium mt-1">{e.title}</p>
                  {e.description && (
                    <p className="text-sm text-gray-500">{e.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-4">Hadisə yoxdur</p>
          )}
        </Card>
      )}

      {/* Add Event Form */}
      {showAddForm && selectedDate && (
        <Card className="p-4">
          <h3 className="font-bold mb-4">Yeni Hadisə</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Başlıq</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Hadisə başlığı"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tip</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as any })
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="delivery">Çatdırılma</option>
                <option value="meeting">Görüş</option>
                <option value="deadline">Son tarix</option>
                <option value="other">Digər</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Təsvir</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddEvent}>Əlavə Et</Button>
              <Button variant="ghost" onClick={() => setShowAddForm(false)}>
                Ləğv Et
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
