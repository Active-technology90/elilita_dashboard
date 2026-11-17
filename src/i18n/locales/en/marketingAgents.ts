export default {
  // Page header
  pageTitle: "Marketing Agents",
  pageDescription: "Manage agent targets, status, and onboarding activity.",
  agentsCount: "{{count}} agents",
  export: "Export",

  // Stats cards
  statTotalAgents: "Total Agents",
  statCompaniesRegistered: "Companies Registered",
  statActiveAgents: "Active Agents",
  statAvgDailyTarget: "Avg Daily Target",
  statToday: "Today",
  statThisWeek: "This week",
  onboardedLabel: "onboarded",

  // Inactive alert banner
  inactiveAlert_one: "{{count}} inactive agent found.",
  inactiveAlert_other: "{{count}} inactive agents found.",
  viewInactiveAgents: "View inactive agents",

  // Filters
  searchPlaceholder: "Search agents...",
  sortPlaceholder: "Sort",
  statusPlaceholder: "Status",
  clearFilters: "Clear",
  filterAgents: "Filter Agents",
  filterAgentsDesc: "Search by agent name, username, or email",
  resetFilters: "Reset Filters",

  // Sort options
  sortNameAsc: "Name (A-Z)",
  sortNameDesc: "Name (Z-A)",
  sortMostCompanies: "Most Companies",
  sortLeastCompanies: "Least Companies",
  sortHighestDailyTarget: "Highest Daily Target",
  sortHighestWeeklyTarget: "Highest Weekly Target",

  // Category options
  catAllAgents: "All Agents",
  catActive: "Active",
  catInactive: "Inactive",

  // Table columns
  colAgent: "Agent",
  colContact: "Contact",
  colTargets: "Targets",
  colPerformance: "Performance",
  colStatus: "Status",
  colActions: "Actions",
  perDay: "{{count}} / day",
  perWeek: "{{count}} / week",

  // Progress
  perfToday: "Today",
  perfThisWeek: "This week",

  // Status labels
  statusActive: "Active",
  statusInactive: "Inactive",

  // Ranks
  rankTopPerformer: "Top Performer",
  rankOnTrack: "On Track",
  rankNeedsAttention: "Needs Attention",
  rankNoProgress: "No Progress",

  // Actions
  viewProfile: "View profile",
  editAgent: "Edit agent",
  auditBtn: "Audit",
  actionAudit: "Audit",

  // Empty state
  emptyTable: "No marketing agents found matching your query.",

  // Toasts / errors
  loadFailed: "Failed to load marketing agents list",
  updateSuccess: "Agent updated successfully",
  updateFailed: "Failed to update agent",

  // Edit agent modal
  editAgentTitle: "Edit Marketing Agent",
  firstName: "First Name",
  lastName: "Last Name",
  email: "Email",
  phone: "Phone",
  dailyTarget: "Daily Target",
  weeklyTarget: "Weekly Target",
  activeAgent: "Active Agent",

  // Export CSV headers
  csvUsername: "Username",
  csvEmail: "Email",
  csvPhone: "Phone",
  csvCompaniesTotal: "Companies (total)",
  csvToday: "Today",
  csvThisWeek: "This week",
  csvDailyTarget: "Daily Target",
  csvWeeklyTarget: "Weekly Target",
  csvStatus: "Status",

  // ─── AgentPersonalInfoModal ─────────────────────────────────
  agentProfile: "Agent Profile",
  agentProfileDesc: "Detailed information",
  joinedLabel: "Joined:",
  lastLoginLabel: "Last login:",
  labelCompanies: "Companies",
  labelDailyGoal: "Daily Goal",
  labelWeeklyGoal: "Weekly Goal",
  labelAchievement: "Achievement",
  weeklyProgressTitle: "Weekly Target Progress",
  progressDetail:
    "{{percent}}% ({{actual}} / {{target}} companies)",
  progressMsgAchieved: "🎉 Target achieved!",
  progressMsgAlmostThere: "🚀 Almost there!",
  progressMsgKeepGoing: "📈 Keep going!",
  progressMsgStartWorking: "💪 Start working on your targets",
  privateNotesTitle: "Private Notes",
  superAdminOnly: "Super Admin only",
  editBtn: "Edit",
  notesPlaceholder: "Add private notes about this agent...",
  saveNotesBtn: "Save Notes",
  savingNotesBtn: "Saving...",
  cancelBtn: "Cancel",
  noNotesYet: 'No notes added yet. Click "Edit" to add.',
  closeBtn: "Close",

  // ─── AgentAuditModal ────────────────────────────────────────
  agentAuditLabel: "Agent Audit",
  agentIdLabel: "ID:",
  refreshBtn: "Refresh",
  refreshTitle: "Refresh performance metrics",
  closeModal: "Close modal",
  performanceSummary: "Performance Summary",
  dailyTargetLabel: "Daily Target",
  weeklyQuotaLabel: "Weekly Quota",
  totalCompaniesLabel: "Total Companies",
  lifetimeOnboardings: "Total lifetime onboardings",
  activeSubscriptionsLabel: "Active Subscriptions",
  currentlyActivePlans: "Currently active plans",
  subscriptionsByPlan: "Subscriptions by Plan",
  agentActionHistory: "Agent Action History",
  agentActionHistoryDesc:
    "Chronological audit of companies registered and subscriptions onboarded",
  tabCompanies: "Companies ({{count}})",
  tabSubscriptions: "Subscriptions ({{count}})",
  searchCompaniesPlaceholder:
    "Search registered companies by name or type...",
  searchSubscriptionsPlaceholder:
    "Search subscriptions by company or plan...",
  noCompaniesMatched: "No companies matched your search",
  noCompaniesRegistered: "No companies registered yet",
  companiesEmptyHint:
    "Actions performed by this agent will appear here",
  noSubsMatched: "No subscriptions matched your search",
  noSubsStarted: "No subscriptions started yet",
  subsEmptyHint:
    "Client subscriptions initiated by this agent will appear here",
  slugLabel: "Slug:",
  startedLabel: "Started:",
  footerAuditLabel: "Agent Performance & Actions Audit",
  performanceUnavailableTitle: "Performance Data Unavailable",
  retryLoading: "Retry Loading",
  auditLoadFailed: "Failed to load agent performance metrics",
  etbSuffix: "ETB",
  subStatusActive: "Active",
  subStatusExpired: "Expired",
};