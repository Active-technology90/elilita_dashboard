export default {
  // ─── Common ─────────────────────────────────────────────
  roles: {
    admin: "Admin",
    staff: "Dispatcher",
    delivery: "Delivery",
    viewer: "Viewer",
    owner: "Owner",
    superAdmin: "Super Admin",
    unknown: "—",
  },
  vehicles: {
    motorcycle: "Motorcycle",
    car: "Car",
    bicycle: "Bicycle",
    van: "Van",
    foot: "Foot",
    unknown: "—",
  },
  actions: {
    cancel: "Cancel",
    close: "Close",
    save: "Save changes",
    saving: "Updating...",
    create: "Create",
    creating: "Creating...",
    remove: "Remove",
    removing: "Removing...",
    edit: "Edit",
    delete: "Delete",
    search: "Search",
  },

  // ─── Edit User Modal ────────────────────────────────────
  editModal: {
    title: "Edit Profile & Role",
    subtitle: "Update user information and permissions",
    closeAria: "Close",
    currentRolePrefix: "Current role:",
    firstNameLabel: "First Name",
    lastNameLabel: "Last Name",
    emailLabel: "Email",
    usernameLabel: "Username",
    phoneLabel: "Phone Number",
    phoneRestricted: "(restricted)",
    phoneHint: "Phone number cannot be edited",
    phoneAria: "Phone number cannot be changed for security reasons",
    roleLabel: "Role",
    rolePlaceholder: "Select Role",
    vehicleTypeLabel: "Vehicle Type",
    vehicleTypePlaceholder: "Select Vehicle Type",
    vehicleTypeHint: "Select the type of vehicle this delivery person will use.",
    requiredMark: "*",

    errors: {
      firstNameRequired: "First name is required",
      lastNameRequired: "Last name is required",
      emailRequired: "Email is required",
      emailInvalid: "Invalid email address",
      usernameRequired: "Username is required",
      vehicleTypeRequired: "Vehicle type is required for delivery personnel",
      missingUserId:
        "Cannot save: missing user ID. Please refresh the page and try again.",
    },
  },

  // ─── Delete User Modal ──────────────────────────────────
  deleteModal: {
    closeAria: "Close",
    removeDispatcherTitle: "Remove Dispatcher",
    removeUserTitle: "Remove User",
    dispatcherSubtitle:
      "Dispatcher access will be removed from this company.",
    confirmPrefix: "Are you sure you want to remove",
    confirmSuffix: "as a {{subject}} from this company?",
    subjectDispatcher: "dispatcher",
    subjectUser: "user",
    membershipNote: "This company membership will be removed.",
    cancel: "Cancel",
    removing: "Removing...",
    removeDispatcherBtn: "Remove Dispatcher",
    removeUserBtn: "Remove User",
  },

  // ─── Create User Modal ──────────────────────────────────
  createModal: {
    createDispatcherTitle: "Create Dispatcher",
    createUserTitle: "Create User",
    createDispatcherSubtitle: "Create and onboard a dispatcher",
    createUserSubtitle: "Create and onboard a company user instantly",
    closeAria: "Close",
    firstNameLabel: "First Name",
    firstNamePlaceholder: "Abebe",
    lastNameLabel: "Last Name",
    lastNamePlaceholder: "Bikila",
    usernameLabel: "Username",
    usernamePlaceholder: "abebe123",
    emailLabel: "Email",
    emailPlaceholder: "abebe@example.com",
    phoneLabel: "Phone Number",
    phoneVendorHint: "(Ethio Telecom & Safaricom)",
    phonePlaceholder: "09XXXXXXXX, 07XXXXXXXX or +251...",
    phoneTooltip:
      "Accepts Ethio Telecom (09/+2519) and Safaricom (07/+2517) numbers",
    phoneExample: "Ethio Telecom: 0911000000 · Safaricom: 0711000000",
    roleLabel: "Role",
    rolePlaceholder: "Select Role",
    vehicleTypeLabel: "Vehicle Type",
    vehicleTypePlaceholder: "Select Vehicle Type",
    vehicleTypeHint:
      "Select the type of vehicle this delivery person will use.",
    passwordLabel: "Password",
    passwordPlaceholder: "Strong password...",
    passwordStrengthLabel: "Password strength",
    passwordStrengthWeak: "Weak",
    passwordStrengthMedium: "Medium",
    passwordStrengthStrong: "Strong",
    confirmPasswordLabel: "Confirm Password",
    confirmPasswordPlaceholder: "Confirm password...",
    submitCreateDispatcher: "Create Dispatcher",
    submitCreateUser: "Create User",
    cancel: "Cancel",

    errors: {
      firstNameRequired: "First name is required",
      firstNameMin: "Minimum 2 characters required",
      lastNameRequired: "Last name is required",
      lastNameMin: "Minimum 2 characters required",
      usernameRequired: "Username is required",
      usernameFormat:
        "3-20 characters. Letters, numbers & underscore only",
      emailRequired: "Email is required",
      emailInvalid: "Invalid email address",
      phoneRequired: "Phone number is required",
      phoneInvalid:
        "Use 09XXXXXXXX, 07XXXXXXXX, +2519XXXXXXXX or +2517XXXXXXXX",
      passwordRequired: "Password is required",
      passwordMin: "Minimum 8 characters required",
      passwordComplexity:
        "Include uppercase, number and special character",
      confirmPasswordRequired: "Please confirm your password",
      confirmPasswordMismatch: "Passwords do not match",
      vehicleTypeRequired:
        "Vehicle type is required for delivery personnel",
    },
  },

  // ─── Company Users Table ────────────────────────────────
  table: {
    columnUser: "User",
    columnEmail: "Email",
    columnRole: "Role",
    columnRating: "Rating",
    columnActions: "Actions",
    unnamedUser: "Unnamed user",
    noRatings: "No ratings",
    ratingValue: "{{rating}} ({{reviews}})",
    editTitle: "Edit team role",
    editAria: "Edit {{name}}",
    removeDispatcherTitle: "Remove dispatcher",
    removeUserTitle: "Remove user",
    removeAria: "Remove {{name}}",
    selfDeleteTitle: "You cannot delete yourself",
    selfDeleteAria: "You cannot delete yourself",
    emptyMessage: "No users found",
  },

  // ─── Company Users page ─────────────────────────────────
  page: {
    accessRestrictedTitle: "Access restricted",
    accessRestrictedDescription:
      "You do not have permission to manage this company's users.",
    selectCompanyTitle: "Team & Dispatcher Management",
    selectCompanySubtitle:
      "Select a company to manage users, dispatchers and access.",
    selectCompanySearchPlaceholder: "Search companies by name...",
    noCompanySelected: "Select a company to manage its users.",
    pageTitleSuperAdmin: "Company Users",
    pageTitleCompany: "All Users",
    pageEyebrowSuperAdmin: "User Management",
    pageDescription:
      "Manage dispatchers, delivery personnel and company access.",
    userCountOne: "{{count}} user",
    userCountMany: "{{count}} users",
    switchCompany: "Switch company",
    switchCompanyShort: "Switch",

    statTotal: "Total",
    statAdmins: "Admins",
    statDispatchers: "Dispatchers",
    statDelivery: "Delivery",
    statViewers: "Viewers",

    limitReachedTitle: "Staff Limit Reached ({{current}}/{{max}}):",
    limitReachedDescription:
      "Your current subscription tier has reached its maximum staff members limit. Please upgrade your subscription plan to add or onboard more team members.",
    limitReachedTooltip: "Staff limit reached ({{current}}/{{max}})",
    addMember: "Add member",
    createUser: "Create user",

    searchPlaceholder: "Search team members",
    pageSizeLabel: "{{count}} / page",
    allRolesLabel: "All roles",
    roleOptionAdmin: "Admin ({{count}})",
    roleOptionStaff: "Dispatcher ({{count}})",
    roleOptionViewer: "Viewer ({{count}})",
    roleOptionDelivery: "Delivery ({{count}})",

    noUsersTitle: "No users found",
    noUsersDescription: "Try another search or role filter.",
    clearFilters: "Clear filters",

    filtersTitle: "Filters",
    filtersDescription: "Narrow the user list by role.",
    closeFiltersAria: "Close filters",
    showCount: "Show {{count}}",

    toastCreateSuccess: "User created successfully",
    toastCreateFailed: "Failed to create user",
    toastCreateFailedFallback:
      "Failed to create user. Please try again.",
    toastUpdateSuccess: "User role updated successfully",
    toastUpdateFailed: "Failed to update user.",
    toastDeleteSuccess: "User removed successfully",
    toastDeleteFailed: "Failed to remove user.",
    toastMissingUserId: "Cannot save: missing user ID.",
  },

addUserModal: {
  title: "Add team member",
  subtitle: "Search by email or phone number",

  searchLabel: "Search user",
  searchPlaceholder: "Email or phone number...",
  searching: "Searching...",
  noUsersFound: "No users found",
  noUsersHint: "Try a different email or phone number.",
  selected: "Selected",

  clearSearchAria: "Clear search",
  removeSelectionAria: "Remove selected user",
  closeAria: "Close",

  roleLabel: "Assign role",
  roleOptions: {
    admin: "Admin – Full access to company management",
    staff: "Dispatcher – Manage orders and dispatch operations",
    delivery: "Delivery Personnel – Handle assigned deliveries",
    viewer: "Viewer – Read-only access",
  },

  roleHint: "Roles can be changed later without affecting user data.",

  cancel: "Cancel",
  addUser: "Add User",
  addDispatcher: "Add Dispatcher",
  adding: "Adding...",
},

}