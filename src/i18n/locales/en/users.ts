export default {
  // Page
  pageTitle: "User Management",
  pageDescription: "Manage users, roles, and company access.",
  usersCount: "{{count}} users",
  createUser: "Create user",
  createUserShort: "Create",

  // Stats
  statAdmins: "Admins",
  statDispatchers: "Dispatchers",
  statViewers: "Viewers",
  statDelivery: "Delivery",
  statNoCompany: "No company",

  // Filters
  searchPlaceholder: "Search users, email, phone or company",
  clearSearch: "Clear search",
  filterUsers: "Filter users",
  allRoles: "All roles",
  roleAdmin: "Admin",
  roleDispatcher: "Dispatcher",
  roleViewer: "Viewer",
  roleDelivery: "Delivery",
  roleOwner: "Owner",
  roleNoCompany: "No company",
  pageSize5: "5 rows",
  pageSize10: "10 rows",
  pageSize15: "15 rows",
  pageSize30: "30 rows",
  pageSize60: "60 rows",
  filterUsersTitle: "Filter users",
  filterUsersDesc: "Choose a role to narrow the user list.",

  // Table headers
  colUser: "User",
  colEmail: "Email",
  colPhone: "Phone",
  colJoined: "Joined",
  colCompanies: "Companies / roles",
  colStatus: "Status",
  colAction: "Action",
  newBadge: "New",
  noCompanies: "No companies",
  noCompaniesAssigned: "No companies assigned",

  // Status
  statusActive: "Active",
  statusInactive: "Inactive",

  // Actions menu
  actionsFor: "Actions for {{name}}",
  viewProfile: "View profile",
  editUser: "Edit user",
  manageMemberships: "Manage memberships",
  removeUser: "Remove user",

  // Empty state
  noUsersTitle: "No users found",
  noUsersDesc: "Try a different search or role filter.",
  resetFilters: "Reset filters",

  // Error state
  couldNotLoadUsers: "Could not load users",
  retry: "Retry",

  // Phone
  phoneNotProvided: "Not provided",

  // Manage memberships modal
  manageMembershipsTitle: "Manage Memberships",
  addMembershipTitle: "Add New Membership",
  addMembershipDesc: "Assign this user to another company",
  selectCompany: "Select a company",
  noCompaniesMatch: "No companies match your search",
  addMembership: "Add Membership",
  allAssigned: "All companies are already assigned",
  currentCompanies: "Current Companies",
  noMembershipsTitle: "No memberships yet",
  noMembershipsDesc: "This user has not been assigned to any company.",
  membershipAccess: "Membership Access",
  updating: "Updating",
  removeMembership: "Remove Membership",
  removeMembershipTitle: "Remove Membership",
  removeMembershipConfirm:
    "Are you sure you want to remove {{company}} from {{user}}? This will revoke all access to that company.",
  subscriptionLimitReached: "Subscription limit reached",
  somethingWentWrong: "Something went wrong",
  edit: "Edit",
  cancel: "Cancel",
  done: "Done",

  // Edit user modal
  editProfileTitle: "Edit Profile & Role",
  editProfileDesc: "Update user information and permissions",
  currentRole: "Current role:",
  firstName: "First Name",
  lastName: "Last Name",
  email: "Email",
  username: "Username",
  phoneNumber: "Phone Number",
  phoneRestricted: "(restricted)",
  phoneCannotEdit: "Phone number cannot be edited",
  role: "Role",
  vehicleType: "Vehicle Type",
  vehicleTypeHint:
    "Select the type of vehicle this delivery person will use.",
  marketingAgent: "Marketing Agent",
  marketingAgentDesc:
    "Designate this user as an Elilita marketing person",
  dailyTarget: "Daily Registration Target",
  weeklyTarget: "Weekly Registration Target",
  activeAccount: "Active Account",
  activeAccountDesc: "User can log in and access the platform",
  saveChanges: "Save changes",
  updatingBtn: "Updating...",

  // Vehicle choices
  vehicleMotorcycle: "Motorcycle",
  vehicleCar: "Car",
  vehicleBicycle: "Bicycle",
  vehicleVan: "Van",
  vehicleFoot: "Foot",
  selectVehicleType: "Select Vehicle Type",

  // Create user modal
  createDispatcher: "Create Dispatcher",
  createUserTitle: "Create User",
  createDispatcherDesc: "Create and onboard a dispatcher",
  createUserDesc: "Create and onboard a company user instantly",
  firstNamePlaceholder: "Abebe",
  lastNamePlaceholder: "Bikila",
  usernamePlaceholder: "abebe123",
  emailPlaceholder: "abebe@example.com",
  phonePlaceholder: "09XXXXXXXX, 07XXXXXXXX or +251...",
  phoneHint: "Ethio Telecom: 0911000000 · Safaricom: 0711000000",
  password: "Password",
  passwordPlaceholder: "Strong password...",
  confirmPassword: "Confirm Password",
  confirmPasswordPlaceholder: "Confirm password...",
  passwordStrength: "Password strength",
  strengthWeak: "Weak",
  strengthMedium: "Medium",
  strengthStrong: "Strong",
  createBtn: "Creating...",
  cancelBtn: "Cancel",

  // Validation — edit/create
  firstNameRequired: "First name is required",
  lastNameRequired: "Last name is required",
  usernameRequired: "Username is required",
  emailRequired: "Email is required",
  emailInvalid: "Invalid email address",
  phoneRequired: "Phone number is required",
  passwordRequired: "Password is required",
  passwordMinLength: "Minimum 8 characters required",
  passwordRequirements:
    "Include uppercase, number and special character",
  confirmPasswordRequired: "Please confirm your password",
  passwordsDontMatch: "Passwords do not match",
  vehicleRequired:
    "Vehicle type is required for delivery personnel",
  usernameInvalid:
    "3-20 characters. Letters, numbers & underscore only",
  phoneInvalid:
    "Use 09XXXXXXXX, 07XXXXXXXX, +2519XXXXXXXX or +2517XXXXXXXX",
  min2Chars: "Minimum 2 characters required",

  // View user modal
  userProfile: "User profile",
  userInformation: "User Information",
  userInformationDesc: "Personal and account details",
  emailLabel: "Email",
  phoneLabel: "Phone",
  userIdLabel: "User ID",
  companiesLabel: "Companies",
  rolesLabel: "Roles",
  companyMemberships: "Company Memberships",
  noCompanyMemberships: "No company memberships",
  deleteUser: "Delete User",

  // Toasts
  userUpdated: "User updated successfully",
  userUpdateFailed: "Failed to update user",
  userCreated: "User created successfully",
  userCreateFailed: "Failed to create user",
  roleUpdated: "Role updated to {{role}}",
  roleUpdateFailed: "Failed to update role",
  roleUpdatedSuccess: "Role updated successfully",
  removeFailed: "Failed to remove company",
  userRemoved: "Removed {{user}} from {{company}}",
  membershipAdded: "Membership added successfully",
  membershipAddFailed: "Failed to add membership",
  membershipRemoved: "User removed from company",
  membershipRemoveFailed: "Failed to remove membership",
  userNotFound: "User not found",
  membershipNotFound: "Membership not found",
  companyNotFound: "Selected company not found",
  companyNotFoundGeneric: "Company not found",
  fetchUsersFailed: "Failed to fetch users",
    // ConfirmDeleteModal
deleteDefaultTitle: "Delete User",
deleteDefaultMessage:
  "Are you sure you want to delete this user? This action cannot be undone.",
deleteBtn: "Delete",
deletingBtn: "Deleting...",
};