// src/components/admin/CompanyManagement/NonSuperAdminView.tsx
import React, { useState, useEffect } from "react";
import CompanyCard from "./CompanyCard";
import CompanyForm, { type CompanyFormData } from "./CompanyForm";
import CompanyFormSkeleton from "./CompanyFormSkeleton";
import type { CompanyListItem, HeadCompany } from "../../../types";
import type { Category, SubCategory } from "../../../types";

// ========== LOADING SKELETON ==========
const SkeletonCard = () => (
  <div className="relative flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full min-w-0 max-w-full animate-pulse">
    <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-gradient-to-r from-gray-200 to-gray-300" />
    <div className="flex flex-col flex-1 px-4 pb-4 pt-0">
      <div className="flex items-end gap-3 -mt-7 mb-3">
        <div className="flex-shrink-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gray-200 border-4 border-white shadow-md" />
        </div>
        <div className="flex-1 min-w-0 pt-7">
          <div className="h-5 bg-gray-200 rounded w-28 mb-1.5" />
          <div className="h-3.5 bg-gray-200 rounded w-20" />
        </div>
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 bg-gray-200 rounded w-20" />
        <div className="h-4 w-14 bg-gray-200 rounded-full" />
      </div>
      <div className="rounded-lg border border-gray-100 overflow-hidden divide-y divide-gray-100">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 px-3 py-2 bg-gray-50/50"
          >
            <div className="flex-shrink-0 w-6 h-6 rounded-md bg-gray-200" />
            <div className="flex-1">
              <div className="h-2.5 bg-gray-200 rounded w-14 mb-1" />
              <div className="h-3.5 bg-gray-200 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SkeletonWorkspace = () => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
    <div className="border-b border-gray-100 px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="h-5 bg-gray-200 rounded w-32 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-24" />
        </div>
        <div className="h-9 w-28 bg-gray-200 rounded-lg" />
      </div>
      <div className="flex items-center gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-24 bg-gray-200 rounded-full" />
        ))}
      </div>
    </div>
    <CompanyFormSkeleton currentStep={0} />
  </div>
);

interface NonSuperAdminViewProps {
  companies: CompanyListItem[];
  userCompanyRole: string | null;
  onEdit: (company: CompanyListItem) => void;
  loading?: boolean;
  formData: CompanyFormData;
  setFormData: React.Dispatch<React.SetStateAction<CompanyFormData>>;
  formErrors: Record<string, string>;
  categories: Category[];
  subcategories: SubCategory[];
  logoPreview: string | null;
  coverPreview: string | null;
  onLogoFileChange?: (file: File | null) => void;
  onCoverFileChange?: (file: File | null) => void;
  isEditingActive: boolean;
  submitting: boolean;
  editingSlug: string | null;
  headCompanyName?: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onCloseForm: () => void;
  headCompanies?: HeadCompany[];
}

export default function NonSuperAdminView({
  companies,
  userCompanyRole,

  headCompanies,
  onEdit,
  loading = false,
  formData,
  setFormData,
  formErrors,
  categories,
  subcategories,
  logoPreview,
  coverPreview,
  onLogoFileChange,
  onCoverFileChange,
  isEditingActive,
  submitting,
  editingSlug,
  headCompanyName,
  onSubmit,
  onCloseForm,
}: NonSuperAdminViewProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isEditingActive) {
      setCurrentStep(0);
    }
  }, [isEditingActive]);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return (
          !!formData.name.trim() &&
          formData.category !== 0 &&
          formData.sub_category !== 0 &&
          !!formData.business_type &&
          !!formData.slug.trim()
        );
      case 1:
        return (
          !!formData.contact_phone.trim() &&
          !!formData.contact_email.trim() &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email.trim())
        );
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (isEditingActive) {
      if (validateStep(currentStep)) {
        setCurrentStep(Math.min(3, currentStep + 1));
      } else {
        alert("Please fill in all required fields before proceeding.");
      }
    } else {
      setCurrentStep(Math.min(2, currentStep + 1));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  const canEdit =
    userCompanyRole === "owner" ||
    userCompanyRole === "admin" ||
    userCompanyRole === "super_admin";

  // In View Mode: only show steps 1-3 (Basic Info, Location, Media)
  // In Edit Mode: show all 4 steps including Review
  const visibleStepLabels = isEditingActive
    ? [
        "Basic Information",
        "Location & Contact",
        "Media & Documents",
        "Review & Submit",
      ]
    : ["Basic Information", "Location & Contact", "Media & Documents"];

  const maxStep = isEditingActive ? 3 : 2;

  const stepIcons = [
    // Basic Information
    <svg
      key="basic"
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
    </svg>,
    // Location & Contact
    <svg
      key="location"
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>,
    // Media & Documents
    <svg
      key="media"
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>,
    // Review & Submit
    <svg
      key="review"
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>,
  ];

  return (
    <div className="flex w-full max-w-full flex-col items-start gap-4 lg:h-full lg:min-h-0 lg:flex-row lg:gap-5 lg:overflow-hidden">
      {/* Left: Company Identity Sidebar */}
      <div className="flex w-full flex-shrink-0 flex-col gap-3 lg:h-full lg:w-[300px] lg:self-start lg:overflow-hidden xl:w-[320px] 2xl:w-[360px]">
        {loading ? (
          <SkeletonCard />
        ) : (
          companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onEdit={onEdit}
              userRole={userCompanyRole}
            />
          ))
        )}
      </div>

      {/* Right: Main Workspace */}
      <div className="flex w-full min-w-0 flex-1 flex-col gap-3 lg:h-full lg:min-h-0 lg:overflow-hidden">
        {loading ? (
          <SkeletonWorkspace />
        ) : (
          companies.length > 0 && (
            <div className="flex flex-col gap-3 lg:h-full lg:min-h-0 lg:overflow-hidden">
              {/* Workspace Header */}
              <div className="z-20 flex-shrink-0 rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                        isEditingActive
                          ? "bg-secondary/10 text-secondary"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {isEditingActive ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                          <path d="M4 20h16" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="3"
                            y="11"
                            width="18"
                            height="11"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-gray-900 truncate">
                        Company Information
                      </h2>
                      <p className="text-xs text-gray-500 truncate">
                        {isEditingActive
                          ? "Editing company profile"
                          : "Review your company details and settings"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isEditingActive ? (
                      <>
                        <button
                          type="button"
                          onClick={onCloseForm}
                          className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors duration-150"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {!canEdit && (
                          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                x="3"
                                y="11"
                                width="18"
                                height="11"
                                rx="2"
                                ry="2"
                              />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            View Only
                          </span>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => {
                              onEdit(companies[0]);
                              setCurrentStep(0);
                            }}
                            className="px-4 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors duration-150 bg-secondary hover:bg-secondary-light text-white cursor-pointer"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                              <path d="M4 20h16" />
                            </svg>
                            Edit Company
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Stepper - Always Visible */}
                <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
                  {/* Desktop Stepper */}
                  <div className="hidden md:block">
                    <div className="flex items-center">
                      {visibleStepLabels.map((label, index) => (
                        <React.Fragment key={index}>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(index)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                              currentStep === index
                                ? "bg-secondary text-white shadow-sm"
                                : currentStep > index
                                  ? "text-emerald-600 hover:bg-emerald-50"
                                  : "text-gray-500 hover:bg-gray-100"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                currentStep === index
                                  ? "bg-white/20"
                                  : currentStep > index
                                    ? "bg-emerald-100"
                                    : "bg-gray-200"
                              }`}
                            >
                              {currentStep > index ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : (
                                index + 1
                              )}
                            </span>
                            <span className="hidden lg:inline">{label}</span>
                            <span className="lg:hidden">{index + 1}</span>
                          </button>
                          {index < visibleStepLabels.length - 1 && (
                            <div
                              className={`flex-1 h-px mx-2 ${
                                currentStep > index
                                  ? "bg-emerald-300"
                                  : "bg-gray-200"
                              }`}
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Stepper */}
                  <div className="md:hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">
                        Step {currentStep + 1} of {visibleStepLabels.length}
                      </span>
                      <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        {stepIcons[currentStep]}
                        {visibleStepLabels[currentStep]}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {visibleStepLabels.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setCurrentStep(index)}
                          className={`flex-1 h-1.5 rounded-full transition-all duration-150 ${
                            currentStep === index
                              ? "bg-secondary"
                              : currentStep > index
                                ? "bg-emerald-400"
                                : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable workspace content: form + footer */}
              <div className="min-h-0 flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1 lg:scrollbar-thin lg:scrollbar-track-transparent lg:scrollbar-thumb-gray-300">
                <div className="flex flex-col gap-4 pb-1">
                  {/* Form Container */}
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <CompanyForm
                  formData={formData}
                  setFormData={setFormData}
                  formErrors={formErrors}
                  categories={categories}
                  subcategories={subcategories}
                  logoPreview={logoPreview}
                  coverPreview={coverPreview}
                  onLogoFileChange={onLogoFileChange}
                  onCoverFileChange={onCoverFileChange}
                  isEditingActive={isEditingActive}
                  canManageActiveStatus={false}
                  headCompanies={headCompanies}
                  submitting={submitting}
                  editingSlug={editingSlug}
                  headCompanyName={headCompanyName}
                  currentStep={currentStep}
                  onSubmit={onSubmit}
                  onClose={onCloseForm}
                    />
                  </div>

                  {/* Navigation Footer - normal content, not sticky */}
                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={currentStep === 0}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center gap-1.5"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Previous
                  </button>

                  {isEditingActive ? (
                    currentStep === 3 ? (
                      <button
                        type="button"
                        onClick={onSubmit}
                        disabled={submitting}
                        className="flex-1 sm:flex-none px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors duration-150 disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
                          <polygon points="18 2 22 6 12 16 8 16 8 12 18 2" />
                        </svg>
                        {submitting ? "Saving..." : "Update Company"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="flex-1 sm:flex-none px-6 py-2 rounded-lg bg-secondary hover:bg-secondary-light text-white text-xs font-semibold transition-colors duration-150 shadow-sm flex items-center justify-center gap-1.5"
                      >
                        Next Step
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={currentStep === maxStep}
                      className="flex-1 sm:flex-none px-6 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center gap-1.5"
                    >
                      Next
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
