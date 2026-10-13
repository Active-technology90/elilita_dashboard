// src/components/dashboard/vedorOrders/DeliveryManager.tsx
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  RefreshCw,
  X,
  User,
  Loader2,
  ChevronDown,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  assignDelivery,
  updateDeliveryPerson,
  getCompanyStaffByRole,
} from "../../../services/api";
import type { Delivery } from "../../../types";
import { useToast } from "../../../hooks/useToast";

interface DeliveryPerson {
  id: number; // This is the User ID (for assignment)
  name: string;
  phone?: string;
  avatar?: string | null;
  status?: "available" | "busy";
}

interface DeliveryManagerProps {
  orderId: number;
  currentDelivery: Delivery | null;
  companySlug: string;
  onUpdate: () => void;
}
const StatusBadge = ({ status }: { status?: string }) => {
  if (status === "available") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
        <CheckCircle className="h-3 w-3" /> Available
      </span>
    );
  }

  if (status === "busy") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
        <Clock className="h-3 w-3" /> Busy
      </span>
    );
  }

  return null;
};
export function DeliveryManager({
  orderId,
  currentDelivery,
  companySlug,
  onUpdate,
}: DeliveryManagerProps) {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

// ---------- StatusBadge (move here) ----------

  // Fetch delivery staff filtered by role "delivery" for this company
  const fetchDeliveryPersons = async () => {
    try {
      const res = await getCompanyStaffByRole(companySlug, "delivery");
      const results = res.data.results || res.data || [];

      const mapped: DeliveryPerson[] = results
        .map((staff: any) => ({
          id: staff.user?.id,
          name:
            `${staff.user?.first_name || ""} ${staff.user?.last_name || ""}`.trim() ||
            staff.user?.username ||
            staff.user?.email,
          phone: staff.user?.phone_number,
          avatar: staff.user?.profile_image,
          status: "available",
        }))
        .filter((p: DeliveryPerson) => p.id); // explicit type

      setDeliveryPersons(mapped);
    } catch (err) {
      console.error("Failed to fetch delivery staff", err);
      setDeliveryPersons([]);
    }
  };

  const filteredPersons = useMemo(() => {
    if (!searchTerm.trim()) return deliveryPersons;
    const term = searchTerm.toLowerCase();
    return deliveryPersons.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.phone && p.phone.includes(term)),
    );
  }, [deliveryPersons, searchTerm]);

  const selectedPerson = deliveryPersons.find((p) => p.id === selectedPersonId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openModal = async () => {
    await fetchDeliveryPersons();
    // `delivery_person` and `id` must be added to the `Delivery` interface (see note below)
    setSelectedPersonId(currentDelivery?.delivery_person ?? null);
    setSearchTerm("");
    setIsModalOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSubmit = async () => {
    if (!selectedPersonId) {
      showToast("error", "Please select a delivery person");
      return;
    }
    setLoading(true);
    try {
      if (currentDelivery) {
        // updateDeliveryPerson expects (deliveryId, userId)
        await updateDeliveryPerson(String(currentDelivery.id), selectedPersonId);
        showToast("success", "Delivery person updated");
      } else {
        await assignDelivery({
          vendor_order: orderId,
          delivery_person: selectedPersonId,
        });
        showToast("success", "Delivery assigned");
      }
      setIsModalOpen(false);
      setSelectedPersonId(null);
      onUpdate();
    } catch (err: any) {
      showToast("error", err.response?.data?.detail || "Operation failed");
    } finally {
      setLoading(false);
    }
  };


  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      transition: { duration: 0.2, ease: "easeIn" },
    },
  } as const; // as const fixes the ease type

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  };

  return (
    <>
      <button
        onClick={openModal}
        className={`inline-flex items-center justify-center p-2.5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
          !currentDelivery
            ? "text-green-600 hover:text-green-700 hover:bg-green-50 focus:ring-green-500"
            : "text-blue-600 hover:text-blue-700 hover:bg-blue-50 focus:ring-blue-500"
        }`}
        title={
          !currentDelivery
            ? "Assign delivery person"
            : "Change delivery person"
        }
      >
        {!currentDelivery ? (
          <Truck className="h-4 w-4" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
      </button>
  
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 px-8 pt-6 pb-4  bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {currentDelivery
                        ? "Change delivery person"
                        : "Assign delivery"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {currentDelivery
                        ? `Update Delivery person  for order #${orderId}`
                        : `Assign a Delivery person  to order #${orderId}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400  hover:text-gray-600 transition-colors rounded-full border border-gray-400 p-1.5 hover:bg-gray-100 -mt-1 -mr-2"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
             <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                {currentDelivery && (
                  <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Current Delivery person 
                      </p>
                      <p className="text-base font-medium text-gray-900 mt-0.5">
                        {currentDelivery.delivery_person_name || "Unassigned"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="relative" ref={dropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Delivery person <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Search by name or phone..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none text-base"
                    />
                    <ChevronDown
                      className={`absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none transition-transform duration-200 ${
                        showDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {showDropdown && (
                    <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
                      {filteredPersons.length === 0 ? (
                        <div className="p-8 text-center">
                          <User className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                          <p className="text-base text-gray-500">
                            No delivery persons found
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            Try a different search term
                          </p>
                        </div>
                      ) : (
                        filteredPersons.map((person) => (
                          <button
                            key={person.id}
                            onClick={() => {
                              setSelectedPersonId(person.id);
                              setSearchTerm(person.name);
                              setShowDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-0 ${
                              selectedPersonId === person.id
                                ? "bg-indigo-50"
                                : ""
                            }`}
                          >
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {person.avatar ? (
                                <img
                                  src={person.avatar}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-600 font-medium text-base">
                                  {person.name[0]?.toUpperCase() || "?"}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-gray-900 truncate">
                                {person.name}
                              </p>
                              {person.phone && (
                                <p className="text-sm text-gray-500">
                                  {person.phone}
                                </p>
                              )}
                            </div>
                            <StatusBadge status={person.status} />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {selectedPerson && (
                  <div className="bg-indigo-50 rounded-xl p-4 flex items-center gap-3 shadow-sm border border-indigo-100">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                      {selectedPerson.avatar ? (
                        <img
                          src={selectedPerson.avatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-indigo-600 font-bold text-lg">
                          {selectedPerson.name[0]?.toUpperCase() || "?"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {selectedPerson.name}
                      </p>
                      {selectedPerson.phone && (
                        <p className="text-sm text-gray-500">
                          {selectedPerson.phone}
                        </p>
                      )}
                    </div>
                     <StatusBadge status={selectedPerson?.status} />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-8 py-5 border-t bg-white flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !selectedPersonId}
                  className="px-5 py-2.5 bg-secondary text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm font-medium flex items-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading
                    ? currentDelivery
                      ? "Updating..."
                      : "Assigning..."
                    : currentDelivery
                    ? "Update"
                    : "Assign"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}