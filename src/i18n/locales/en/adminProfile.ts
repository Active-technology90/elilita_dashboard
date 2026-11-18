export default {
  tabs: {
    editProfile: "Edit Profile",
    changePassword: "Change Password",
    memberships: "Memberships",
    profile: "Profile",
    password: "Password",
  },

  fields: {
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email Address",
    phoneNumber: "Phone Number",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
  },

  placeholders: {
    firstName: "First Name",
    lastName: "Last Name",
    email: "you@example.com",
    phoneNumber: "+251 9XX XXX XXX",
    currentPassword: "Enter current password",
    newPassword: "New password (min. 8 characters)",
    confirmPassword: "Confirm new password",
  },

  hints: {
    phoneFormat: "Format: +251XXXXXXXXX or 09XXXXXXXX",
    passwordMinLength: "Password must be at least 8 characters",
  },

  actions: {
    signOut: "Sign Out",
    updateProfile: "Update Profile",
    updating: "Updating...",
    changePassword: "Change Password",
    saving: "Saving...",
    cancel: "Cancel",
    showPassword: "Show password",
    hidePassword: "Hide password",
  },

  messages: {
    profileUpdated: "Profile updated successfully",
    passwordChanged: "Password changed successfully",
  },

  validation: {
    currentPasswordRequired: "Current password is required",
    passwordMinLength: "Password must be at least 8 characters",
    passwordsDoNotMatch: "Passwords do not match",
  },

  errors: {
    profileUpdateFailed: "Failed to update profile",
    phoneAlreadyUsed:
      "Phone number is already in use by another account. Please use a different number.",
    phoneNumberError: "Phone number: {{error}}",
    passwordChangeFailed: "Failed to change password",
    imageTooLarge: "Image must be less than 5MB",
    avatarUploadFailed: "Failed to upload avatar",
  },

  labels: {
    avatar: "Profile avatar",
    changeProfilePhoto: "Change profile photo",
  },

  membership: {
    yourCompanies: "Your Companies",
    companyCount_one: "{{count}} company",
    companyCount_other: "{{count}} companies",
    dispatcher: "Dispatcher",
    active: "Active",
    inactive: "Inactive",
    noMemberships: "No company memberships found",

    roles: {
      admin: "Admin",
      staff: "Staff",
      viewer: "Viewer",
      superadmin: "Super Admin",
    },
  },

  logout: {
    title: "Sign Out",
    confirmation:
      "Are you sure you want to sign out of your account?",
  },
};