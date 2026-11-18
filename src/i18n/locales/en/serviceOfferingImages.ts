
export default {
  loading: "Loading images...",
  title: "Service Images",
  description:
    "Upload photos customers will see when browsing this service. Mark one as primary.",
  imageAlt: "Service",
  primary: "Primary",

  upload: {
    dropzone: "Click or drag an image here",
    formats: "JPG, PNG, WebP up to 5MB",
    addMore: "Add more",
  },

  actions: {
    setPrimary: "Set as primary",
    delete: "Delete",
  },

  deleteDialog: {
    title: "Delete image?",
    description: "This image will be removed from the service listing.",
    cancel: "Cancel",
    confirm: "Delete",
  },

  messages: {
    loadFailed: "Failed to load images",
    imageOnly: "Please upload an image file",
    maxFileSize: "Image must be less than 5MB",
    uploadSuccess: "Image uploaded",
    uploadFailed: "Upload failed",
    primaryUpdated: "Primary image updated",
    primaryUpdateFailed: "Failed to set primary image",
    deleteSuccess: "Image deleted",
    deleteFailed: "Delete failed",
  },
};
