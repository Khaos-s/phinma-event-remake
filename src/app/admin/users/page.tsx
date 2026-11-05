"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Check,
  Copy,
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useAccount } from "@/components/auth-provider";
import { WorkspaceShell } from "@/components/workspace-shell";
import { LoadingPanel } from "@/components/loading-panel";
import { useFeedbackToasts } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { colleges, collegeLabel } from "@/lib/academics";
import { roleHome } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import "../admin.css";

type OrganizerDb = {
  user_id: string;
  email: string;
  organization_id: string;
  organization_name: string;
  department: string;
  course: string | null;
};

type AffiliationType = "student" | "faculty" | "external";

type UserRecord = {
  id: string;
  schoolId: string;
  email: string;
  role: "organizer" | "member";
  affiliation: AffiliationType;
  department: string | null;
  course: string | null;
  organizationName?: string;
  status: "active";
};

const DEFAULT_ORGANIZER_IDS: Record<string, string> = {
  "cite.organizer@gmail.com": "04-2324-039960",
  "com.organizer@gmail.com": "04-2223-018241",
  "coa.organizer@gmail.com": "04-2324-025190",
  "coed.organizer@gmail.com": "04-2122-034112",
  "ccje.organizer@gmail.com": "04-2223-049812",
  "coe.organizer@gmail.com": "04-2324-051829",
  "cahs.organizer@gmail.com": "04-2223-012904",
  "cme.organizer@gmail.com": "04-2324-061033",
};

const SEED_NORMAL_USERS: UserRecord[] = [
  {
    id: "std-001",
    schoolId: "04-2324-039960",
    email: "john.arvey@phinmaed.com",
    role: "member",
    affiliation: "student",
    department: "College of Information Technology",
    course: "BSIT",
    status: "active",
  },
  {
    id: "std-002",
    schoolId: "04-2324-023819",
    email: "maria.santos@phinmaed.com",
    role: "member",
    affiliation: "student",
    department: "College of Management",
    course: "BSHM",
    status: "active",
  },
  {
    id: "std-003",
    schoolId: "04-2223-039412",
    email: "carlos.reyes@phinmaed.com",
    role: "member",
    affiliation: "student",
    department: "College of Engineering",
    course: "BSCE",
    status: "active",
  },
  {
    id: "std-004",
    schoolId: "04-2122-018942",
    email: "prof.mendoza@phinmaed.com",
    role: "member",
    affiliation: "faculty",
    department: "College of Allied Health Sciences",
    course: "BSN",
    status: "active",
  },
  {
    id: "std-005",
    schoolId: "04-2324-055102",
    email: "elena.torres@phinmaed.com",
    role: "member",
    affiliation: "student",
    department: "College of Accountancy",
    course: "BSA",
    status: "active",
  },
  {
    id: "std-006",
    schoolId: "External",
    email: "community.guest@gmail.com",
    role: "member",
    affiliation: "external",
    department: null,
    course: null,
    status: "active",
  },
];

function formatSchoolIdInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw.trim();
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 12)}`;
}

export default function AdminUsersPage() {
  const client = useMemo(() => createClient(), []);
  const account = useAccount();
  const router = useRouter();

  const [organizers, setOrganizers] = useState<OrganizerDb[]>([]);
  const [normalUsers, setNormalUsers] = useState<UserRecord[]>(() => {
    if (typeof window === "undefined") return SEED_NORMAL_USERS;
    try {
      const stored = localStorage.getItem("phinma_registered_students_v1");
      return stored ? JSON.parse(stored) : SEED_NORMAL_USERS;
    } catch {
      return SEED_NORMAL_USERS;
    }
  });
  const [organizerIdMap, setOrganizerIdMap] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return DEFAULT_ORGANIZER_IDS;
    try {
      const stored = localStorage.getItem("phinma_account_ids_v1");
      return stored ? { ...DEFAULT_ORGANIZER_IDS, ...JSON.parse(stored) } : DEFAULT_ORGANIZER_IDS;
    } catch {
      return DEFAULT_ORGANIZER_IDS;
    }
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [notice, setNotice] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter and tab states
  const [activeTab, setActiveTab] = useState<"all" | "organizers" | "users">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedAffiliation, setSelectedAffiliation] = useState<string>("all");

  // Modal creation states
  const [modalOpen, setModalOpen] = useState(false);
  const [accountType, setAccountType] = useState<"organizer" | "user">("organizer");
  const [formAffiliation, setFormAffiliation] = useState<AffiliationType>("student");
  const [formSchoolId, setFormSchoolId] = useState("04-2324-039960");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("123412341234");
  const [formDepartment, setFormDepartment] = useState<string>(colleges[0].name);
  const [formCourse, setFormCourse] = useState<string>(colleges[0].courses[0].code);
  const [formPublisher, setFormPublisher] = useState("");

  const saving = useRef(false);
  useFeedbackToasts(error, notice);

  const courses = useMemo(() => {
    return colleges.find((item) => item.name === formDepartment)?.courses ?? [];
  }, [formDepartment]);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await client.rpc("admin_organizers");
    if (result.error) {
      setFetchError(`Organizer accounts could not be loaded. ${result.error.message}`);
    } else {
      setFetchError("");
      setOrganizers(result.data ?? []);
    }
    setLoading(false);
  }, [client]);

  useEffect(() => {
    async function checkAccess() {
      if (account.loading || account.error) return;
      if (!account.user) {
        router.replace("/login");
        return;
      }
      if (account.role !== "event_admin") {
        router.replace(roleHome(account.role));
        return;
      }
      await load();
    }
    void checkAccess();
  }, [account, load, router]);

  // Combined records for the unified table
  const allRecords = useMemo<UserRecord[]>(() => {
    const organizerRecords: UserRecord[] = organizers.map((org, index) => {
      const knownId =
        organizerIdMap[org.email.toLowerCase()] ||
        DEFAULT_ORGANIZER_IDS[org.email.toLowerCase()] ||
        `04-2324-0${39960 + index}`;
      return {
        id: org.user_id,
        schoolId: knownId,
        email: org.email,
        role: "organizer",
        affiliation: "student",
        department: org.department,
        course: org.course,
        organizationName: org.organization_name,
        status: "active",
      };
    });

    return [...organizerRecords, ...normalUsers];
  }, [organizers, normalUsers, organizerIdMap]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return allRecords.filter((record) => {
      if (activeTab === "organizers" && record.role !== "organizer") return false;
      if (activeTab === "users" && record.role !== "member") return false;
      if (selectedDepartment !== "all" && record.department !== selectedDepartment) return false;
      if (selectedAffiliation !== "all" && record.affiliation !== selectedAffiliation) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchId = record.schoolId.toLowerCase().includes(query);
        const matchEmail = record.email.toLowerCase().includes(query);
        const matchDept = record.department?.toLowerCase().includes(query);
        const matchCourse = record.course?.toLowerCase().includes(query);
        const matchOrg = record.organizationName?.toLowerCase().includes(query);
        return matchId || matchEmail || matchDept || matchCourse || matchOrg;
      }

      return true;
    });
  }, [allRecords, activeTab, selectedDepartment, selectedAffiliation, searchQuery]);

  // Copy helper
  function copyText(text: string, id: string) {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Handle department change in form
  function handleFormDepartmentChange(newDept: string) {
    setFormDepartment(newDept);
    const available = colleges.find((c) => c.name === newDept)?.courses ?? [];
    if (available.length) {
      setFormCourse(available[0].code);
    }
  }

  // Submit Account Creation
  async function handleCreateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    setError("");
    setNotice("");

    const email = formEmail.trim().toLowerCase();
    const password = formPassword;

    if (!email || !password) {
      setError("Please complete all required fields.");
      return;
    }

    if (accountType === "organizer") {
      // Organizer registration rules
      if (!formPublisher.trim()) {
        setError("Please enter a publisher or organization name.");
        return;
      }
      if (!formSchoolId.trim()) {
        setError("A valid PHINMA School ID (e.g. 04-2324-039960) is required for organizers.");
        return;
      }
      if (password.length < 12) {
        setError("Password must be at least 12 characters.");
        return;
      }

      saving.current = true;
      setBusy(true);

      try {
        const body = {
          email,
          password,
          organization: formPublisher.trim(),
          department: formDepartment,
          course: formCourse,
        };

        const result = await client.functions.invoke("admin-register-organizer", { body });
        if (result.error) {
          let message = "Registration could not be confirmed. Check your input and try again.";
          if (result.error.context instanceof Response) {
            try {
              const detail = await result.error.context.json();
              if (typeof detail.error === "string") message = detail.error;
            } catch {}
          }
          setError(message);
          return;
        }

        // Save ID association
        const updatedIds = { ...organizerIdMap, [email]: formSchoolId.trim() };
        setOrganizerIdMap(updatedIds);
        localStorage.setItem("phinma_account_ids_v1", JSON.stringify(updatedIds));

        setNotice(
          result.data?.existingAccount
            ? `Organizer access granted to ${email}. Existing account keeps its password.`
            : `Organizer account created for ${email} with ID ${formSchoolId}. Share credentials securely.`
        );
        setModalOpen(false);
        await load();
      } catch {
        setError("Failed to reach organizer registration service. Please retry.");
      } finally {
        saving.current = false;
        setBusy(false);
      }
    } else {
      // Normal Student / User registration rules
      const isPhinmaSchool = formAffiliation === "student" || formAffiliation === "faculty";

      if (isPhinmaSchool) {
        if (!formSchoolId.trim() || !formSchoolId.startsWith("04-")) {
          setError('PHINMA students and employees must have a valid School ID starting with "04-" (e.g. 04-2324-039960).');
          return;
        }
        if (!email.endsWith("@phinmaed.com")) {
          setError('PHINMA students and employees must use their official "@phinmaed.com" email address.');
          return;
        }
      }

      if (password.length < 12) {
        setError("Password must be at least 12 characters.");
        return;
      }

      const newRecord: UserRecord = {
        id: `usr-${Date.now()}`,
        schoolId: isPhinmaSchool ? formSchoolId.trim() : "External",
        email,
        role: "member",
        affiliation: formAffiliation,
        department: isPhinmaSchool ? formDepartment : null,
        course: formAffiliation === "student" ? formCourse : null,
        status: "active",
      };

      const updated = [newRecord, ...normalUsers];
      setNormalUsers(updated);
      try {
        localStorage.setItem("phinma_registered_students_v1", JSON.stringify(updated));
      } catch {}

      setNotice(
        `User account registered for ${email} (${isPhinmaSchool ? `ID: ${formSchoolId}` : "External Guest"}). Initial password set.`
      );
      setModalOpen(false);
      // Reset form defaults
      setFormEmail("");
    }
  }

  if (account.error) {
    return (
      <WorkspaceShell title="Manage users" wide>
        <p role="alert" className="form-error">
          {account.error}
        </p>
      </WorkspaceShell>
    );
  }

  if (account.loading || account.role !== "event_admin") {
    return (
      <WorkspaceShell title="Manage users" wide>
        <LoadingPanel>Checking administrator access…</LoadingPanel>
      </WorkspaceShell>
    );
  }

  const organizerCount = allRecords.filter((r) => r.role === "organizer").length;
  const userCount = allRecords.filter((r) => r.role === "member").length;
  const phinmaCount = allRecords.filter((r) => r.schoolId.startsWith("04-")).length;

  return (
    <WorkspaceShell title="Manage users & organizers" wide>
      <div className="admin-users-page">
        {/* Page Header */}
        <div className="admin-users-header-row">
          <div>
            <h1>Manage users & organizers</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Directory of authorized event organizers, student leaders, and registered PHINMA University of Iloilo attendees.
            </p>
          </div>
          <div className="admin-users-header-actions">
            <Button variant="outline" disabled={busy || loading} onClick={() => void load()}>
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} aria-hidden="true" />
              Refresh
            </Button>
            <Button onClick={() => setModalOpen(true)}>
              <UserPlus size={16} aria-hidden="true" />
              Create Account
            </Button>
          </div>
        </div>

        {/* Feedback alerts */}
        {(error || fetchError) && (
          <p role="alert" className="form-error">
            {error || fetchError}
          </p>
        )}
        {notice && (
          <p role="status" className="success-notice">
            {notice}
          </p>
        )}

        {/* Metrics Summary Strip */}
        <div className="admin-users-metrics">
          <div className="admin-metric-card">
            <span className="metric-label">
              <Users size={14} /> Total Accounts
            </span>
            <span className="metric-value">{allRecords.length}</span>
            <span className="metric-hint">Active university accounts</span>
          </div>
          <div className="admin-metric-card">
            <span className="metric-label">
              <Shield size={14} /> Organizers
            </span>
            <span className="metric-value">{organizerCount}</span>
            <span className="metric-hint">Authorized council publishers</span>
          </div>
          <div className="admin-metric-card">
            <span className="metric-label">
              <GraduationCap size={14} /> Students & Users
            </span>
            <span className="metric-value">{userCount}</span>
            <span className="metric-hint">Normal attendees & members</span>
          </div>
          <div className="admin-metric-card">
            <span className="metric-label">
              <UserCheck size={14} /> PHINMA Verified
            </span>
            <span className="metric-value">{phinmaCount}</span>
            <span className="metric-hint">With confirmed 04- ID & @phinmaed</span>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="admin-users-toolbar">
          <div className="admin-users-tabs" role="tablist" aria-label="Account categories">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "all"}
              className={`admin-users-tab-btn ${activeTab === "all" ? "is-active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All Accounts
              <span className="admin-tab-count">{allRecords.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "organizers"}
              className={`admin-users-tab-btn ${activeTab === "organizers" ? "is-active" : ""}`}
              onClick={() => setActiveTab("organizers")}
            >
              Manage Organizers
              <span className="admin-tab-count">{organizerCount}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "users"}
              className={`admin-users-tab-btn ${activeTab === "users" ? "is-active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              Manage Users & Students
              <span className="admin-tab-count">{userCount}</span>
            </button>
          </div>

          <div className="admin-users-filters">
            <div className="admin-search-box">
              <Search size={15} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search ID (04-...), email, college..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search accounts"
              />
            </div>

            <select
              className="admin-filter-select"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              aria-label="Filter by department"
            >
              <option value="all">All Departments</option>
              {colleges.map((col) => (
                <option key={col.code} value={col.name}>
                  {col.code} · {col.name}
                </option>
              ))}
            </select>

            <select
              className="admin-filter-select"
              value={selectedAffiliation}
              onChange={(e) => setSelectedAffiliation(e.target.value)}
              aria-label="Filter by affiliation"
            >
              <option value="all">All Affiliations</option>
              <option value="student">PHINMA Student</option>
              <option value="faculty">PHINMA Faculty / Staff</option>
              <option value="external">External Guest</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="admin-table-wrapper">
          <table className="admin-data-table" aria-label="University Accounts Table">
            <thead>
              <tr>
                <th scope="col">Identification (ID)</th>
                <th scope="col">User & Email</th>
                <th scope="col">Role & Affiliation</th>
                <th scope="col">College / Department</th>
                <th scope="col">Course / Program</th>
                <th scope="col">Publisher Organization</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    No accounts found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const isExternal = record.schoolId === "External";
                  const initial = record.email[0]?.toUpperCase() ?? "U";
                  const isPhinmaDomain = record.email.endsWith("@phinmaed.com");

                  return (
                    <tr key={`${record.role}-${record.id}`}>
                      {/* School ID */}
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`admin-id-badge ${isExternal ? "is-external" : ""}`}>
                            {record.schoolId}
                          </span>
                          {!isExternal && (
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground transition-colors p-1"
                              title="Copy ID"
                              aria-label={`Copy ID ${record.schoolId}`}
                              onClick={() => copyText(record.schoolId, `id-${record.id}`)}
                            >
                              {copiedId === `id-${record.id}` ? (
                                <Check size={13} className="text-primary" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Account User */}
                      <td>
                        <div className="admin-user-cell">
                          <span className="admin-user-cell-avatar" aria-hidden="true">
                            {initial}
                          </span>
                          <div className="admin-user-cell-meta">
                            <strong>{record.email.split("@")[0]}</strong>
                            <span>
                              {record.email}
                              {isPhinmaDomain && (
                                <span className="admin-phinma-tag" title="Verified PHINMA account">
                                  PHINMA
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role & Affiliation */}
                      <td>
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`admin-role-badge ${
                              record.role === "organizer"
                                ? "is-organizer"
                                : record.affiliation === "faculty"
                                ? "is-faculty"
                                : record.affiliation === "student"
                                ? "is-student"
                                : "is-guest"
                            }`}
                          >
                            {record.role === "organizer" ? (
                              <>
                                <ShieldCheck size={12} /> Organizer
                              </>
                            ) : record.affiliation === "faculty" ? (
                              <>
                                <Building2 size={12} /> Faculty / Staff
                              </>
                            ) : record.affiliation === "student" ? (
                              <>
                                <GraduationCap size={12} /> Student
                              </>
                            ) : (
                              "External Guest"
                            )}
                          </span>
                          <span className="text-[11px] text-muted-foreground capitalize">
                            {record.affiliation === "student"
                              ? "PHINMA Student"
                              : record.affiliation === "faculty"
                              ? "PHINMA Faculty"
                              : "Guest Attendee"}
                          </span>
                        </div>
                      </td>

                      {/* Department */}
                      <td>
                        {record.department ? (
                          <span className="font-medium text-foreground">
                            {collegeLabel(record.department)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Course */}
                      <td>
                        {record.course ? (
                          <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-muted border border-border">
                            {record.course}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Publisher Organization */}
                      <td>
                        {record.organizationName ? (
                          <span className="font-semibold text-primary">
                            {record.organizationName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span className="admin-status-cell">
                          <span className="admin-status-dot" aria-hidden="true" />
                          Active
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal: Create Account */}
        {modalOpen && (
          <div
            className="admin-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="admin-modal-dialog">
              <div className="admin-modal-header">
                <h2 id="modal-title">
                  {accountType === "organizer"
                    ? "Register Organizer Account"
                    : "Register Student / User Account"}
                </h2>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Close dialog"
                  onClick={() => setModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateAccount}>
                <div className="admin-modal-body">
                  {/* Account Type Selector */}
                  <div className="space-y-2">
                    <Label>Select Account Category</Label>
                    <div className="admin-type-tabs">
                      <button
                        type="button"
                        className={`admin-type-tab-btn ${
                          accountType === "organizer" ? "is-active" : ""
                        }`}
                        onClick={() => {
                          setAccountType("organizer");
                          setFormAffiliation("student");
                        }}
                      >
                        <Shield size={16} /> Organizer Account
                      </button>
                      <button
                        type="button"
                        className={`admin-type-tab-btn ${
                          accountType === "user" ? "is-active" : ""
                        }`}
                        onClick={() => setAccountType("user")}
                      >
                        <GraduationCap size={16} /> Student / Normal User
                      </button>
                    </div>
                  </div>

                  {/* Affiliation Dropdown (For Normal Users) */}
                  {accountType === "user" && (
                    <div className="space-y-2">
                      <Label htmlFor="form-affiliation">Affiliation / Persona</Label>
                      <select
                        id="form-affiliation"
                        className="course-select"
                        value={formAffiliation}
                        onChange={(e) => setFormAffiliation(e.target.value as AffiliationType)}
                      >
                        <option value="student">PHINMA UI Student (Requires ID & @phinmaed.com)</option>
                        <option value="faculty">PHINMA UI Faculty / Staff (Requires ID & @phinmaed.com)</option>
                        <option value="external">External Guest / Attendee (No school ID required)</option>
                      </select>
                    </div>
                  )}

                  {/* School ID Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="form-school-id">
                        PHINMA School ID{" "}
                        {accountType === "organizer" || formAffiliation !== "external" ? (
                          <span className="text-destructive">*</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">(Not applicable)</span>
                        )}
                      </Label>
                      <span className="text-xs text-muted-foreground font-mono">Format: 04-2324-039960</span>
                    </div>
                    <Input
                      id="form-school-id"
                      type="text"
                      placeholder="04-2324-039960"
                      maxLength={14}
                      value={formSchoolId}
                      disabled={accountType === "user" && formAffiliation === "external"}
                      onChange={(e) => setFormSchoolId(formatSchoolIdInput(e.target.value))}
                      required={accountType === "organizer" || formAffiliation !== "external"}
                    />
                    <p className="text-xs text-muted-foreground">
                      {accountType === "organizer"
                        ? 'Organizers are required to be students or employees of PHINMA UI ("04-" campus code).'
                        : formAffiliation === "external"
                        ? "School ID is ignored for external participants."
                        : 'Official campus ID number identifying student or staff at PHINMA UI.'}
                    </p>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="form-email">
                        Email Address <span className="text-destructive">*</span>
                      </Label>
                      {(accountType === "organizer" || formAffiliation !== "external") && (
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline font-medium"
                          onClick={() => {
                            const prefix = formEmail.split("@")[0] || "student";
                            setFormEmail(`${prefix}@phinmaed.com`);
                          }}
                        >
                          + @phinmaed.com
                        </button>
                      )}
                    </div>
                    <Input
                      id="form-email"
                      type="email"
                      placeholder={
                        accountType === "organizer" || formAffiliation !== "external"
                          ? "username@phinmaed.com"
                          : "user@example.com"
                      }
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required
                    />
                    {accountType === "organizer" || formAffiliation !== "external" ? (
                      <p className="text-xs text-muted-foreground">
                        Use the official <strong>@phinmaed.com</strong> university domain.
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        External guest email address for invitations and ticketing.
                      </p>
                    )}
                  </div>

                  {/* Initial Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="form-password">
                      Initial Password <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="form-password"
                      type="password"
                      minLength={12}
                      maxLength={128}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      12–128 characters. Deliver securely to the account owner.
                    </p>
                  </div>

                  {/* Department & Course (For Organizer or Student/Faculty) */}
                  {(accountType === "organizer" || formAffiliation !== "external") && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="form-department">Department / College</Label>
                        <select
                          id="form-department"
                          className="course-select"
                          value={formDepartment}
                          onChange={(e) => handleFormDepartmentChange(e.target.value)}
                        >
                          {colleges.map((col) => (
                            <option key={col.code} value={col.name}>
                              {col.code} · {col.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="form-course">Assigned Course</Label>
                        <select
                          id="form-course"
                          className="course-select"
                          value={formCourse}
                          onChange={(e) => setFormCourse(e.target.value)}
                          required
                        >
                          {courses.map((crs) => (
                            <option key={crs.code} value={crs.code}>
                              {crs.code} · {crs.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Publisher / Organization (Only for Organizers) */}
                  {accountType === "organizer" && (
                    <div className="space-y-2">
                      <Label htmlFor="form-publisher">
                        Publisher / Organization Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="form-publisher"
                        list="modal-publisher-suggestions"
                        placeholder="e.g. CITE Student Council or COM Faculty Events"
                        maxLength={120}
                        value={formPublisher}
                        onChange={(e) => setFormPublisher(e.target.value)}
                        required
                      />
                      <datalist id="modal-publisher-suggestions">
                        {[
                          ...new Set(
                            organizers
                              .filter((item) => item.department === formDepartment)
                              .map((item) => item.organization_name)
                          ),
                        ].map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                      <p className="text-xs text-muted-foreground">
                        Organizers are authorized to submit and manage events strictly under this publisher scope.
                      </p>
                    </div>
                  )}
                </div>

                <div className="admin-modal-footer">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={busy}>
                    <Plus size={16} aria-hidden="true" />
                    {busy
                      ? "Registering…"
                      : accountType === "organizer"
                      ? "Register Organizer"
                      : "Create User Account"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
