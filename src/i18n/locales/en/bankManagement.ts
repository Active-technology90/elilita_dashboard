export default {
  // Page header
  pageTitle: "Bank Accounts",
  pageDescSuperAdmin: "Manage all company bank accounts.",
  pageDescCompany: "Manage bank accounts for {{company}}.",
  addBankAccount: "Add Bank Account",
  addShort: "Add",

  // Search & filters
  searchPlaceholder: "Search bank, account number, or holder...",
  filterAllStatus: "All Status",
  filterActive: "Active",
  filterInactive: "Inactive",
  filterAllChapa: "All Chapa",
  filterLinked: "Linked",
  filterNotLinked: "Not Linked",
  activeFiltersLabel: "Active filters:",
  statusChip: "Status: {{value}}",
  chapaChip: "Chapa: {{value}}",
  clearAll: "Clear all",

  // Status badges
  statusActive: "Active",
  statusInactive: "Inactive",
  chapaLinked: "Linked",

  // Chapa badge
  chapaLinkedTitle: "Chapa subaccount linked — click to manage",
  chapaConnectTitle: "Connect a Chapa subaccount for this company",
  chapaLinkTitle: "Link a Chapa subaccount for this company",
  chapaConnect: "Connect",
  chapaLink: "Link",

  // Table
  colNo: "No.",
  colBank: "Bank",
  colCompany: "Company",
  colAccountNumber: "Account No.",
  colAccountHolder: "Account Holder",
  colStatus: "Status",
  colActions: "Actions",
  naValue: "N/A",
  editAria: "Edit {{bank}}",
  deleteAria: "Delete {{bank}}",

  // Mobile card
  accountLabel: "Account",
  holderLabel: "Holder",
  companyLabel: "Company",
  showAccount: "Show account number",
  hideAccount: "Hide account number",
  edit: "Edit",
  delete: "Delete",

  // Empty states
  emptyMobileTitle: "No bank accounts found",
  emptyMobileWithFilters: "Try adjusting your search or filters.",
  emptyMobileNoAccounts: "Add your first bank account to get started.",
  emptyMobileNoAccess: "No accounts available.",
  emptyTableAdd: "No bank accounts found. Add your first bank account to get started.",
  emptyTableDefault: "No bank accounts found.",

  // Delete modal
  deleteBankAccount: "Delete Bank Account",
  deleteBankTitle: 'Bank Account "{{name}}"',

  // Chapa button
  chapaButton: "Chapa Direct Split Settlement",

  // Chapa dropdown
  chapaDropdownHeader: "Chapa Direct Split Settlement",
  chapaDropdownSubtitle: "Choose a company to configure",
  closeAria: "Close",
  searchCompanyPlaceholder: "Search company...",
  clearSearch: "Clear search",
  allCompanies: "All Companies",
  allCompaniesHint: "Reset selection",
  noMatchingCompany: "No matching company",
  noMatchingCompanyHint: "Try a different name or slug.",

  // Chapa card wrapper
  chapaChangeBtn: "Change",
  chapaCloseAria: "Close settlement card",
  selectedCompanyFallback: "Selected Company",

  // Form modal
  editFormTitle: "Edit Bank Account",
  addFormTitle: "Add Bank Account",
  formDescSuperAdmin: "Manage bank account details",
  formDescCompany: "Add a company bank account",
  closeModalAria: "Close modal",
  bankSectionTitle: "Bank",
  bankSelectedTitle: "Bank selected",
  bankSelectedDesc: "The bank name and logo come from the system bank list.",
  companyRequired: "Company",
  companyHint: "Select the vendor company this bank account belongs to.",
  accountInfoTitle: "Account Information",
  accountNumber: "Account Number",
  accountNumberPlaceholder: "e.g. 100013456789",
  accountHolder: "Account Holder Name",
  accountHolderPlaceholder: "e.g. ABC Trading PLC",
  settingsTitle: "Settings",
  displayOrder: "Display Order",
  cancel: "Cancel",
  updateAccount: "Update Account",
  createAccount: "Create Account",

  // Bank selector
  selectBank: "Select Bank",
  banksCount: "{{count}} banks",
  loadingBanks: "Loading banks...",
  selectedLabel: "Selected",
  chooseBank: "Choose a bank",
  chooseBankHint: "Search or browse available banks",
  searchBankPlaceholder: "Search CBE, Awash, Dashen...",
  noMatchingBank: "No matching bank",
  noMatchingBankHint: "Try a different name.",

  // Validation
  bankRequired: "Please select a bank",
  accountNumberRequired: "Account number is required",
  accountHolderRequired: "Account holder name is required",
  companyRequiredError: "Please select a company",

  // Toasts / errors
  loadFailed: "Failed to load bank accounts",
  createSuccess: "Bank account created successfully",
  updateSuccess: "Bank account updated successfully",
  deleteSuccess: "Bank account deleted successfully",
  createFailed: "Failed to create bank account",
  updateFailed: "Failed to update bank account",
  deleteFailed: "Failed to delete bank account",
  // ─── ChapaDirectSettlementCard ─────────────────────────────
chapaCardTitle: "Chapa Direct Split Settlement",
chapaCardNoCompanyDesc: "Select a company to view and configure Chapa split payments.",
chapaCardTitleWithCompany: "Chapa Split Settlement — {{company}}",
chapaLinkedReady: "Linked & Ready",
chapaNotConfigured: "Not Configured",
chapaRefreshTitle: "Refresh status",
chapaRefreshAria: "Refresh Chapa status",
chapaConnectedDesc:
  "Customer payments at checkout are automatically split: vendor merchandise revenue is deposited directly into this store's bank account, and the platform commission is retained in the main account.",
chapaNotConnectedDesc:
  "Enable Chapa online payments at checkout by provisioning a Chapa subaccount. Store earnings are routed directly to the store's verified bank account.",
chapaSubaccountIdLabel: "Subaccount ID:",
chapaPlatformFeeLabel: "Platform Fee:",
chapaUpdateBankBtn: "Update Bank",
chapaDelinkBtn: "De-link",
chapaConnectSubaccountBtn: "Connect Chapa Subaccount",
chapaFetchErrorTitle: "Couldn't load Chapa status",
chapaFetchErrorRetry: "Retry",
chapaProvisionSuccessUpdate: "Chapa subaccount updated successfully!",
chapaProvisionSuccessCreate: "Chapa subaccount provisioned successfully!",

// Delink modal
chapaDelinkTitle: "De-link Chapa Subaccount?",
chapaDelinkMessage:
  'Are you sure you want to de-link the Chapa subaccount for "{{company}}"? Chapa online checkout will be immediately disabled for this store until a new subaccount is provisioned.',
chapaDelinkConfirm: "De-link Subaccount",
chapaDelinking: "De-linking...",
chapaDelinkSuccess: "Chapa subaccount de-linked for {{company}}",
chapaDelinkFailed: "Failed to de-link Chapa subaccount",

// Provision modal
chapaProvisionTitle: "Connect Chapa Split Subaccount",
chapaUpdateBankTitle: "Update Chapa Settlement Bank",
chapaProvisionSubtitle: "Direct settlement for {{company}}",
chapaModalCloseAria: "Close",
chapaTabExisting: "Use Existing Account",
chapaTabNew: "Add New Account",
chapaApiKeyErrorTitle: "Chapa API key / business config issue",
chapaApiKeyErrorBody:
  "Chapa rejected the request because the platform's Chapa API key is invalid or the platform business account can't accept payments right now. This is a backend/admin configuration issue — please contact the platform admin to verify the Chapa API key and business account status.",
chapaBanksFetchFailed: "Failed to load Ethiopian banks from Chapa.",
chapaNoAccountsTitle: "No bank accounts yet",
chapaNoAccountsDesc: "Add a new account to continue.",
chapaAddAccountBtn: "Add account",
chapaSelectAccountError: "Please select a bank account to link.",
chapaAccountNotFoundError: "Selected account could not be found.",
chapaBankMismatchError:
  'Please select the matching Chapa bank for "{{bank}}" below to ensure direct payout settlement and avoid platform tax liability.',
chapaSelectBankError: "Please select a bank from the list.",
chapaAccountNumberRequired: "Account number is required.",
chapaAccountNameRequired:
  "Account holder name is required (as registered with the bank).",
chapaChapaBankLabel: "Chapa Bank:",

chapaSelectDifferentChapaBank: "Select a different Chapa bank:",
chapaSelectMatchingChapaBank:
  'Select matching Chapa-supported bank for "{{bank}}":',
chapaChooseChapaBank: "-- Choose Chapa Bank --",
chapaSelectBankLabel: "Select Bank",
chapaLoadingBanksFromChapa: "Loading banks from Chapa...",
chapaSelectEthiopianBank: "Select an Ethiopian bank",
chapaSearchBankPlaceholder: "Search bank by name or code...",
chapaClearSearch: "Clear search",
chapaNoMatchingBanks: "No matching banks",
chapaNoMatchingBanksHint: "Try a different search",
chapaAccountNumberLabel: "Account Number",
chapaAccountNumberPlaceholder: "e.g. 100012345678",
chapaExpectedLength: "Expected length for {{bank}}:",
chapaDigitsSuffix: "digits",
chapaAccountHolderLabel: "Account Holder Legal Name",
chapaAccountHolderPlaceholder:
  "Full name as registered on the bank account",
chapaAccountHolderHint:
  "Must match the official bank account holder name for KYC verification.",
chapaBusinessNameLabel: "Business / Store Display Name (Optional)",
chapaDirectSettlementGuaranteeTitle: "Direct Settlement Guarantee:",
chapaDirectSettlementGuaranteeBody:
  "Customer checkout transactions are settled directly into this store bank account by Chapa (100% vendor share). Platform commission is retained separately.",
chapaTaxProtectionTitle: "Tax Protection Notice:",
chapaTaxProtectionBody:
  "Only banks supported by Chapa can receive direct payout settlements. Linking an unsupported bank routes customer funds into the platform main account, triggering corporate tax liability.",
chapaCancelBtn: "Cancel",
chapaWorkingBtn: "Working...",
chapaProvisioning: "Provisioning...",
chapaLinking: "Linking...",
chapaUpdateBankWorking: "Updating Bank...",
chapaUpdateBankKeepId: "Update Bank (Keep Subaccount ID)",
chapaUpdateSettlementBank: "Update Settlement Bank",
chapaLinkAccountBtn: "Link Account",
chapaProvisionLinkBtn: "Provision & Link Subaccount",
chapaProvisionFailed: "Failed to provision Chapa subaccount.",
};