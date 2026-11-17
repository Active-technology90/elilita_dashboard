import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  X, User, Mail, Phone, Building2, Target, Award, TrendingUp,
  CheckCircle, XCircle, Edit, Save,
} from "lucide-react";

interface Agent {
  id: number;
  username: string;
  email: string;
  phone_number: string | null;
  first_name: string;
  last_name: string;
  profile_image: string | null;
  is_active: boolean;
  companies_count: number;
  daily_target: number;
  weekly_target: number;
  date_joined?: string;
  last_login?: string | null;
  notes?: string;
}

interface AgentPersonalInfoModalProps {
  agent: Agent;
  onClose: () => void;
}

export default function AgentPersonalInfoModal({
  agent,
  onClose,
}: AgentPersonalInfoModalProps) {
  const { t } = useTranslation("marketingAgents");

  const getInitials = (firstName: string, lastName: string, username: string) => {
    if (firstName && lastName)
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (username) return username[0].toUpperCase();
    return "U";
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return "—";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 12 && cleaned.startsWith("251")) {
      return `+251 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 12)}`;
    }
    return phone;
  };

  const fullName =
    agent.first_name && agent.last_name
      ? `${agent.first_name} ${agent.last_name}`
      : agent.username;

  const weeklyAchievement =
    agent.daily_target > 0
      ? Math.round((agent.companies_count / (agent.daily_target * 7)) * 100)
      : 0;

  const achievementColor =
    weeklyAchievement >= 80
      ? "text-emerald-600"
      : weeklyAchievement >= 50
      ? "text-amber-600"
      : "text-red-500";

  const [notes, setNotes] = useState(agent.notes || "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const response = await fetch(`/api/marketing-agents/${agent.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (response.ok) {
        setEditingNotes(false);
      } else {
        console.error("Failed to save notes");
      }
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setSavingNotes(false);
    }
  };

  const progressMessage = () => {
    if (weeklyAchievement >= 100) return t("progressMsgAchieved");
    if (weeklyAchievement >= 80) return t("progressMsgAlmostThere");
    if (weeklyAchievement >= 50) return t("progressMsgKeepGoing");
    return t("progressMsgStartWorking");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        <div className="bg-secondary/30 px-6 py-5 flex items-center justify-between border-b border-secondary/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center">
              <User className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary">
                {t("agentProfile")}
              </h2>
              <p className="text-secondary/60 text-xs">
                {t("agentProfileDesc")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-secondary/40 hover:bg-secondary/20 text-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center gap-4">
            {agent.profile_image ? (
              <img
                src={agent.profile_image}
                alt={agent.username}
                className="h-20 w-20 rounded-full object-cover border-4 border-secondary/20 shadow-lg"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-secondary to-secondary-dark flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {getInitials(agent.first_name, agent.last_name, agent.username)}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xl font-bold text-gray-900">{fullName}</p>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    agent.is_active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {agent.is_active ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" />
                      {t("statusActive")}
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" />
                      {t("statusInactive")}
                    </>
                  )}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium">
                @{agent.username}
              </p>
              <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {agent.email}
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {formatPhone(agent.phone_number)}
                </div>
                {agent.date_joined && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span>
                      {t("joinedLabel")} {formatDate(agent.date_joined)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50/80 rounded-2xl p-4 border border-blue-100/50">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  {t("labelCompanies")}
                </p>
              </div>
              <p className="text-2xl font-black text-gray-900 mt-1">
                {agent.companies_count}
              </p>
            </div>
            <div className="bg-purple-50/80 rounded-2xl p-4 border border-purple-100/50">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-500" />
                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                  {t("labelDailyGoal")}
                </p>
              </div>
              <p className="text-2xl font-black text-gray-900 mt-1">
                {agent.daily_target}
              </p>
            </div>
            <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-100/50">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-500" />
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  {t("labelWeeklyGoal")}
                </p>
              </div>
              <p className="text-2xl font-black text-gray-900 mt-1">
                {agent.weekly_target}
              </p>
            </div>
            <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-100/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  {t("labelAchievement")}
                </p>
              </div>
              <p className={`text-2xl font-black ${achievementColor} mt-1`}>
                {weeklyAchievement}%
              </p>
            </div>
          </div>

          <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-600">
                {t("weeklyProgressTitle")}
              </span>
              <span className={`font-bold ${achievementColor}`}>
                {t("progressDetail", {
                  percent: weeklyAchievement,
                  actual: agent.companies_count,
                  target: agent.daily_target * 7,
                })}
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  weeklyAchievement >= 80
                    ? "bg-emerald-500"
                    : weeklyAchievement >= 50
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${Math.min(weeklyAchievement, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              {progressMessage()}
            </p>
          </div>

          <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4 text-secondary" />
                <h4 className="font-semibold text-gray-700">
                  {t("privateNotesTitle")}
                </h4>
                <span className="text-[10px] text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                  {t("superAdminOnly")}
                </span>
              </div>
              {!editingNotes && (
                <button
                  onClick={() => setEditingNotes(true)}
                  className="text-xs text-secondary hover:text-secondary-dark font-semibold"
                >
                  {t("editBtn")}
                </button>
              )}
            </div>

            {editingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition"
                  placeholder={t("notesPlaceholder")}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-xl text-sm font-semibold hover:bg-[#5b4694] transition disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {savingNotes ? t("savingNotesBtn") : t("saveNotesBtn")}
                  </button>
                  <button
                    onClick={() => {
                      setNotes(agent.notes || "");
                      setEditingNotes(false);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                  >
                    {t("cancelBtn")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                {notes ? (
                  <div className="bg-white rounded-xl p-3 border border-gray-200 whitespace-pre-wrap">
                    {notes}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">{t("noNotesYet")}</p>
                )}
              </div>
            )}
          </div>

          {agent.last_login && (
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <span>
                {t("lastLoginLabel")} {formatDate(agent.last_login)}
              </span>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-secondary to-secondary-dark text-white rounded-xl font-semibold hover:shadow-lg transition shadow-md active:scale-95"
          >
            {t("closeBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}